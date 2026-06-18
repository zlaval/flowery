package com.zlrx.eventstreammodulith.order

import org.springframework.modulith.events.Externalized
import kotlin.time.Clock
import kotlin.time.Instant

@Externalized("order-created::#{id}}")
data class OrderCreatedEvent(
    val id: String,
    val name: String,
    val price: Int,
    val timestamp: Instant = Clock.System.now()
)
