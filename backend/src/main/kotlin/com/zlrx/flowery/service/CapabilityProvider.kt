package com.zlrx.flowery.service

import org.springframework.stereotype.Component

interface CapabilityProvider {
    fun getCapabilityName(): String
}

@Component
class DefaultCapabilityProvider : CapabilityProvider {
    override fun getCapabilityName(): String = "BASE_SIMULATION"
}
