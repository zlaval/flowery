package com.zlrx.eventstreammodulith.order

import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class OrderService(
    private val applicationEventPublisher: ApplicationEventPublisher
) {

    @Transactional
    fun createOrder(order: Order): Order {
        val event = OrderCreatedEvent(id = order.id, name = order.name, price = order.price)
        applicationEventPublisher.publishEvent(event)
        return order
    }

}