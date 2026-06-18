package com.zlrx.eventstreammodulith.order

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("api/orders")
class OrderController(
    private val orderService: OrderService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createOrder(@RequestBody request: CreateOrderRequest): Order {
        val order = Order(
            name = request.name,
            price = request.price,
        )
        return orderService.createOrder(order)
    }

}

data class CreateOrderRequest(val price: Int, val name: String)