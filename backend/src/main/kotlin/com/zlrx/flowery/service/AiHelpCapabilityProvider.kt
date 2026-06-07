package com.zlrx.flowery.service

import org.springframework.stereotype.Component

@Component
class AiHelpCapabilityProvider : CapabilityProvider {
    override fun getCapabilityName(): String = "AI_HELP"
}
