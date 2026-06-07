package com.zlrx.flowery.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.zlrx.flowery.model.Diagram
import com.zlrx.flowery.repository.DiagramRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/configs")
@CrossOrigin(origins = ["*"]) // Enable CORS for Vite frontend integration
class ConfigController(
    private val diagramRepository: DiagramRepository,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(ConfigController::class.java)

    /**
     * Save a new configuration.
     * Converts the map configuration to JSON bytes and persists it in the H2 database.
     */
    @PostMapping
    fun saveConfig(@RequestBody config: Map<String, Any>): ResponseEntity<Map<String, String>> {
        val name = config["name"] as? String ?: "Untitled Diagram"
        val structureBytes = objectMapper.writeValueAsBytes(config)
        val saved = diagramRepository.save(Diagram(name = name, structure = structureBytes))
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("id" to saved.id.toString()))
    }

    /**
     * Retrieve a configuration by its database ID key.
     */
    @GetMapping("/{id}")
    fun getConfig(@PathVariable id: Long): ResponseEntity<Any> {
        val diagram = diagramRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        val configMap = objectMapper.readValue(diagram.structure, Map::class.java).toMutableMap()
        configMap["name"] = diagram.name
        configMap["id"] = diagram.id
        return ResponseEntity.ok(configMap)
    }

    /**
     * List all saved configurations formatted as a Map from ID string to configuration data.
     */
    @GetMapping
    fun listConfigs(): ResponseEntity<Map<String, Any>> {
        val diagrams = diagramRepository.findAll()
        val configsMap = diagrams.associate {
            val configMap = objectMapper.readValue(it.structure, Map::class.java).toMutableMap()
            configMap["name"] = it.name
            configMap["id"] = it.id
            it.id.toString() to configMap
        }
        return ResponseEntity.ok(configsMap)
    }
}
