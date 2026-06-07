package com.zlrx.flowery.service

import org.springframework.stereotype.Service

@Service
class CapabilityService(
    private val providers: List<CapabilityProvider>
) {
    fun getActiveCapabilities(): List<String> {
        return providers.map { it.getCapabilityName() }
    }
}
