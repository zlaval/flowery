package com.zlrx.eventstreammodulith.order

import java.util.*

data class Order(
    val id: String = UUID.randomUUID().toString(),
    val price: Int,
    val name: String
)
