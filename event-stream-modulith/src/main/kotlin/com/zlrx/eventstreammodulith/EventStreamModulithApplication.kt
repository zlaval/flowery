package com.zlrx.eventstreammodulith

import com.zlrx.eventstreammodulith.order.OrderCreatedEvent
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.modulith.events.ApplicationModuleListener

@SpringBootApplication
class EventStreamModulithApplication {

    private val logger = LoggerFactory.getLogger(EventStreamModulithApplication::class.java)

    @KafkaListener(topics = ["order-created"])
    fun onOrderCreatedEvent(record: ConsumerRecord<String, String>) {
        logger.info("[Kafka] Received order created event. key: ${record.key()} value: ${record.value()}")
    }

    @ApplicationModuleListener
    fun onOrderCreatedEventBus(event: OrderCreatedEvent) {
        logger.info("[BUS] Received order created event. $event")
    }

}

fun main(args: Array<String>) {
    runApplication<EventStreamModulithApplication>(*args)
}