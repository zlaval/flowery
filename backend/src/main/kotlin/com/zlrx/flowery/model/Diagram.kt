package com.zlrx.flowery.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table

@Table("DIAGRAMS")
data class Diagram(
    @Id
    val id: Long? = null,
    val name: String,
    val structure: ByteArray
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Diagram

        if (id != other.id) return false
        if (name != other.name) return false
        if (!structure.contentEquals(other.structure)) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + name.hashCode()
        result = 31 * result + structure.contentHashCode()
        return result
    }
}
