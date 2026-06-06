package com.zlrx.flowery.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@RestController
@RequestMapping("/api/configs")
@CrossOrigin(origins = ["*"]) // Enable CORS for Vite frontend integration
class ConfigController {

    // Thread-safe map to store configurations in-memory
    private val configStorage = ConcurrentHashMap<UUID, Any>()

    /**
     * Save a new configuration.
     * Generates a unique UUID and stores the configuration object in the map.
     */
    @PostMapping
    fun saveConfig(@RequestBody config: Any): ResponseEntity<Map<String, String>> {
        val id = UUID.randomUUID()
        configStorage[id] = config
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("id" to id.toString()))
    }

    /**
     * Retrieve a configuration by its UUID key.
     */
    @GetMapping("/{id}")
    fun getConfig(@PathVariable id: UUID): ResponseEntity<Any> {
        val config = configStorage[id] ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(config)
    }

    /**
     * List all saved configurations.
     */
    @GetMapping
    fun listConfigs(): ResponseEntity<Map<UUID, Any>> {
        return ResponseEntity.ok(configStorage)
    }
}
