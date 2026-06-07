package com.zlrx.flowery.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table

@Table("DIAGRAMS")
data class Diagram(
    @Id
    val id: Long? = null,
    val name: String,
    val structure: String
)
