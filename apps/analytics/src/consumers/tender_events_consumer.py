import asyncio
import json
import logging
import os
import aio_pika
from pydantic import ValidationError
from ..schemas.events import BidPlacedEvent
from ..analytics.bid_processor import bid_stream_processor

logger = logging.getLogger(__name__)

# Fallback URI, should use environment variable in production
RABBITMQ_URI = os.getenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")
QUEUE_NAME = "analytics_tender_events_queue"
EXCHANGE_NAME = "amq.topic" # Or the specific exchange used by NestJS microservices
ROUTING_KEY = "bidflow.tender.v1.bid_placed"

class TenderEventsConsumer:
    def __init__(self):
        self.connection = None
        self.channel = None
        self._task = None

    async def connect(self):
        try:
            self.connection = await aio_pika.connect_robust(RABBITMQ_URI)
            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=10)

            # Declare queue
            queue = await self.channel.declare_queue(QUEUE_NAME, durable=True)
            
            # Since NestJS EventPattern typically works with a default exchange or topic,
            # we might need to bind it if the exchange is explicit. If NestJS uses default RPC,
            # it might just send directly to the queue. For safety, we bind to a routing key 
            # if we assume topic exchange, but for NestJS standard @EventPattern('pattern'), 
            # it often creates a queue named after the pattern or sends to a topic.
            # Assuming standard topic routing or direct queue matching.
            # If NestJS just uses the routing key as queue name:
            
            # For this implementation, we will consume from a queue that is bound to the event pattern
            exchange = await self.channel.declare_exchange("bidflow.events", aio_pika.ExchangeType.TOPIC, durable=True)
            await queue.bind(exchange, routing_key=ROUTING_KEY)

            logger.info("Connected to RabbitMQ and bound to bid_placed events.")
            
            return queue
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    async def process_message(self, message: aio_pika.abc.AbstractIncomingMessage):
        async with message.process(ignore_processed=True):
            try:
                body_str = message.body.decode("utf-8")
                
                # NestJS wraps payloads in a specific structure if using default RMQ serializer:
                # { "pattern": "bidflow.tender.v1.bid_placed", "data": { ... } }
                raw_dict = json.loads(body_str)
                
                if "data" in raw_dict and "pattern" in raw_dict:
                    payload_data = raw_dict["data"]
                else:
                    payload_data = raw_dict

                # Validate with Pydantic
                event = BidPlacedEvent(**payload_data)
                
                logger.info(f"Processing bid from supplier {event.payload.supplierId} for tender {event.payload.tenderId}")
                
                # Ingest into Pandas Processor
                bid_stream_processor.ingest_bid(
                    tenant_id=event.tenantId,
                    tender_id=event.payload.tenderId,
                    supplier_id=event.payload.supplierId,
                    amount=event.payload.amount,
                    timestamp=event.occurredAt
                )
                
                await message.ack()
                
            except ValidationError as ve:
                logger.error(f"Validation error for message body: {ve.json()}")
                # Send to DLQ by rejecting without requeue
                await message.reject(requeue=False)
            except json.JSONDecodeError:
                logger.error(f"Malformed JSON received: {message.body}")
                await message.reject(requeue=False)
            except Exception as e:
                logger.error(f"Unexpected error processing message: {e}")
                # Don't requeue to avoid poison pills, or requeue depending on policy
                await message.reject(requeue=False)

    async def start_consuming(self):
        try:
            queue = await self.connect()
            logger.info("Starting consumer loop...")
            await queue.consume(self.process_message)
            # Keep running
            await asyncio.Future()
        except asyncio.CancelledError:
            logger.info("Consumer task was cancelled.")
        except Exception as e:
            logger.error(f"Consumer loop failed: {e}")

    async def stop(self):
        if self.connection:
            await self.connection.close()
            logger.info("RabbitMQ connection closed.")

consumer_instance = TenderEventsConsumer()
