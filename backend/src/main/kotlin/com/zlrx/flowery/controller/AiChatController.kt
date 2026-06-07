package com.zlrx.flowery.controller

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = ["*"])
class AiChatController(private val objectMapper: ObjectMapper) {

    private val logger = LoggerFactory.getLogger(AiChatController::class.java)

    @PostMapping("/chat")
    fun chat(@RequestBody request: Map<String, Any>): ResponseEntity<Map<String, Any>> {
        // Log the incoming request JSON as requested by the user
        try {
            val prettyJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request)
            logger.info("Incoming AI Help Request Payload:\n{}", prettyJson)
        } catch (e: Exception) {
            logger.warn("Failed to pretty print incoming JSON payload", e)
            logger.info("Incoming AI Help Request Payload (raw):\n{}", request)
        }

        // Return a simplified mock static diagram as requested: Start -> Order Service -> Database & Kafka
        val staticResponse = mapOf(
            "triggerNodeId" to "node-start",
            "nodes" to listOf(
                mapOf(
                    "id" to "node-start",
                    "type" to "customNode",
                    "position" to mapOf("x" to 100, "y" to 200),
                    "data" to mapOf(
                        "label" to "Start Trigger",
                        "type" to "start",
                        "isTrigger" to true,
                        "hasMessage" to false,
                        "description" to "Generates the initial simulation trigger payload.",
                        "responseTemplate" to "{\n  \"action\": \"create_order\",\n  \"timestamp\": 1780336200\n}",
                        "activeHandles" to listOf("output"),
                        "routingTable" to mapOf(
                            "trigger" to mapOf(
                                "edge-start-service" to true
                            )
                        )
                    )
                ),
                mapOf(
                    "id" to "node-service",
                    "type" to "customNode",
                    "position" to mapOf("x" to 320, "y" to 200),
                    "data" to mapOf(
                        "label" to "Order Service",
                        "type" to "microservice",
                        "isTrigger" to false,
                        "hasMessage" to false,
                        "description" to "Processes client orders and forwards transactions.",
                        "responseTemplate" to "{\n  \"status\": \"ORDER_PROCESSED\"\n}",
                        "activeHandles" to listOf("input", "output-top", "output-bottom"),
                        "routingTable" to mapOf(
                            "edge-start-service" to mapOf(
                                "edge-service-db" to true,
                                "edge-service-kafka" to true
                            )
                        )
                    )
                ),
                mapOf(
                    "id" to "node-db",
                    "type" to "customNode",
                    "position" to mapOf("x" to 580, "y" to 80),
                    "data" to mapOf(
                        "label" to "Order Database",
                        "type" to "database",
                        "isTrigger" to false,
                        "hasMessage" to false,
                        "description" to "Stores transaction logs and checkout order records.",
                        "responseTemplate" to "",
                        "activeHandles" to listOf("input-bottom"),
                        "routingTable" to mapOf<String, Any>()
                    )
                ),
                mapOf(
                    "id" to "node-kafka",
                    "type" to "customNode",
                    "position" to mapOf("x" to 580, "y" to 320),
                    "data" to mapOf(
                        "label" to "Kafka Topic",
                        "type" to "kafka",
                        "isTrigger" to false,
                        "hasMessage" to false,
                        "description" to "Kafka topic carrying order event streams.",
                        "responseTemplate" to "",
                        "activeHandles" to listOf("input-top"),
                        "routingTable" to mapOf<String, Any>()
                    )
                )
            ),
            "edges" to listOf(
                mapOf(
                    "id" to "edge-start-service",
                    "source" to "node-start",
                    "target" to "node-service",
                    "sourceHandle" to "output",
                    "targetHandle" to "input",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "rest",
                        "payload" to "{\n  \"action\": \"create_order\",\n  \"timestamp\": 1780336200\n}",
                        "hasMessage" to false,
                        "description" to "Triggers order processing"
                    )
                ),
                mapOf(
                    "id" to "edge-service-db",
                    "source" to "node-service",
                    "target" to "node-db",
                    "sourceHandle" to "output-top",
                    "targetHandle" to "input-bottom",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "grpc",
                        "payload" to "{\n  \"status\": \"ORDER_PROCESSED\"\n}",
                        "hasMessage" to false,
                        "description" to "Persists transaction details"
                    )
                ),
                mapOf(
                    "id" to "edge-service-kafka",
                    "source" to "node-service",
                    "target" to "node-kafka",
                    "sourceHandle" to "output-bottom",
                    "targetHandle" to "input-top",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "kafka",
                        "payload" to "{\n  \"status\": \"ORDER_PROCESSED\"\n}",
                        "hasMessage" to false,
                        "description" to "Publishes order event"
                    )
                )
            )
        )
        return ResponseEntity.ok(staticResponse)
    }
}
