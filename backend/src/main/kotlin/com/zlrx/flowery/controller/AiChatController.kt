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

        // Return a mock static diagram showing the addition of an AI Analytics Engine
        val staticResponse = mapOf(
            "triggerNodeId" to "node-start",
            "nodes" to listOf(
                mapOf(
                    "id" to "node-start",
                    "type" to "customNode",
                    "position" to mapOf("x" to 40, "y" to 150),
                    "data" to mapOf(
                        "label" to "Start Trigger",
                        "type" to "start",
                        "isTrigger" to true,
                        "hasMessage" to false,
                        "description" to "Generates the initial simulation trigger payload.",
                        "responseTemplate" to "{\n  \"action\": \"initialize_payment_flow\",\n  \"timestamp\": 1780336200\n}",
                        "routingTable" to mapOf(
                            "trigger" to mapOf(
                                "edge-start-a" to true
                            )
                        )
                    )
                ),
                mapOf(
                    "id" to "node-a",
                    "type" to "customNode",
                    "position" to mapOf("x" to 240, "y" to 150),
                    "data" to mapOf(
                        "label" to "Order Service",
                        "type" to "microservice",
                        "isTrigger" to false,
                        "hasMessage" to false,
                        "description" to "Processes client orders.",
                        "responseTemplate" to "{\n  \"status\": \"ORDER_PROCESSED\"\n}",
                        "routingTable" to mapOf(
                            "edge-start-a" to mapOf(
                                "edge-a-db" to true,
                                "edge-a-kafka" to true
                            )
                        )
                    )
                ),
                mapOf(
                    "id" to "node-db",
                    "type" to "customNode",
                    "position" to mapOf("x" to 480, "y" to 50),
                    "data" to mapOf(
                        "label" to "Order Database",
                        "type" to "database",
                        "isTrigger" to false,
                        "hasMessage" to false,
                        "description" to "Stores transaction logs.",
                        "responseTemplate" to "",
                        "routingTable" to mapOf<String, Any>()
                    )
                ),
                mapOf(
                    "id" to "node-kafka",
                    "type" to "customNode",
                    "position" to mapOf("x" to 480, "y" to 280),
                    "data" to mapOf(
                        "label" to "Kafka Topic D",
                        "type" to "kafka",
                        "isTrigger" to false,
                        "hasMessage" to false,
                        "description" to "Kafka topic for dispatching events.",
                        "responseTemplate" to "",
                        "routingTable" to mapOf(
                            "edge-a-kafka" to mapOf(
                                "edge-kafka-b" to true
                            )
                        )
                    )
                ),
                mapOf(
                    "id" to "node-b",
                    "type" to "customNode",
                    "position" to mapOf("x" to 720, "y" to 280),
                    "data" to mapOf(
                        "label" to "Notification Service",
                        "type" to "microservice",
                        "isTrigger" to false,
                        "hasMessage" to false,
                        "description" to "Sends customer alerts.",
                        "responseTemplate" to "{\n  \"status\": \"NOTIFIED\"\n}",
                        "routingTable" to mapOf(
                            "edge-kafka-b" to mapOf(
                                "edge-b-a" to true
                            )
                        )
                    )
                ),
                mapOf(
                    "id" to "node-ai-added",
                    "type" to "customNode",
                    "position" to mapOf("x" to 720, "y" to 50),
                    "data" to mapOf(
                        "label" to "AI Analytics Engine",
                        "type" to "function",
                        "isTrigger" to false,
                        "hasMessage" to false,
                        "description" to "AI-generated analytics function.",
                        "responseTemplate" to "",
                        "routingTable" to mapOf<String, Any>()
                    )
                )
            ),
            "edges" to listOf(
                mapOf(
                    "id" to "edge-start-a",
                    "source" to "node-start",
                    "target" to "node-a",
                    "sourceHandle" to "output",
                    "targetHandle" to "input",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "rest",
                        "payload" to "{\n  \"action\": \"initialize_payment_flow\",\n  \"timestamp\": 1780336200\n}",
                        "hasMessage" to false,
                        "description" to "Triggers the order service"
                    )
                ),
                mapOf(
                    "id" to "edge-a-db",
                    "source" to "node-a",
                    "target" to "node-db",
                    "sourceHandle" to "output-top",
                    "targetHandle" to "input-bottom",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "grpc",
                        "payload" to "{\n  \"status\": \"ORDER_PROCESSED\"\n}",
                        "hasMessage" to false,
                        "description" to "Saves transaction details"
                    )
                ),
                mapOf(
                    "id" to "edge-a-kafka",
                    "source" to "node-a",
                    "target" to "node-kafka",
                    "sourceHandle" to "output",
                    "targetHandle" to "input-top",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "kafka",
                        "payload" to "{\n  \"status\": \"ORDER_PROCESSED\"\n}",
                        "hasMessage" to false,
                        "description" to "Publishes order event"
                    )
                ),
                mapOf(
                    "id" to "edge-kafka-b",
                    "source" to "node-kafka",
                    "target" to "node-b",
                    "sourceHandle" to "output-bottom",
                    "targetHandle" to "input",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "kafka",
                        "payload" to "{\n  \"status\": \"ORDER_PROCESSED\"\n}",
                        "hasMessage" to false,
                        "description" to "Kafka triggers notifications"
                    )
                ),
                mapOf(
                    "id" to "edge-b-a",
                    "source" to "node-b",
                    "target" to "node-a",
                    "sourceHandle" to "output-left",
                    "targetHandle" to "input-right",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "grpc",
                        "payload" to "{\n  \"status\": \"NOTIFIED\"\n}",
                        "hasMessage" to false,
                        "description" to "Acknowledge order status"
                    )
                ),
                mapOf(
                    "id" to "edge-db-ai",
                    "source" to "node-db",
                    "target" to "node-ai-added",
                    "sourceHandle" to "output",
                    "targetHandle" to "input",
                    "type" to "customEdge",
                    "data" to mapOf(
                        "connectionType" to "rest",
                        "payload" to "{}",
                        "hasMessage" to false,
                        "description" to "Sync transaction data to analytics"
                    )
                )
            )
        )
        return ResponseEntity.ok(staticResponse)
    }
}
