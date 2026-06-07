package com.zlrx.flowery.controller

import com.zlrx.flowery.service.CapabilityService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/capabilities")
@CrossOrigin(origins = ["*"]) // Enable CORS for front-end integration
class CapabilityController(
    private val capabilityService: CapabilityService
) {

    @GetMapping
    fun getCapabilities(): List<String> {
        return capabilityService.getActiveCapabilities()
    }
}
