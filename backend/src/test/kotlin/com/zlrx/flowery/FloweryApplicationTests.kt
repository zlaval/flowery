package com.zlrx.flowery

import com.fasterxml.jackson.databind.ObjectMapper
import com.zlrx.flowery.model.Diagram
import com.zlrx.flowery.repository.DiagramRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class FloweryApplicationTests {

	@Autowired
	private lateinit var diagramRepository: DiagramRepository

	@Autowired
	private lateinit var objectMapper: ObjectMapper

	@Test
	fun contextLoads() {
	}

	@Test
	fun testSaveAndLoadRepository() {
		val payload = mapOf(
			"version" to "1.0",
			"name" to "Teszt diagram",
			"triggerNodeId" to "node-start",
			"nodes" to listOf(
				mapOf(
					"id" to "node-start",
					"type" to "customNode",
					"position" to mapOf("x" to -189.5, "y" to 130.0),
					"data" to mapOf(
						"label" to "Start Trigger",
						"type" to "start",
						"isTrigger" to true,
						"hasMessage" to false,
						"description" to "Generates the initial simulation trigger payload.",
						"responseTemplate" to "{\n  \"action\": \"trigger\"\n}",
						"routingTable" to mapOf("trigger" to mapOf("edge-1780847340116" to true))
					)
				)
			),
			"edges" to listOf(
				mapOf(
					"id" to "edge-1780847340116",
					"source" to "node-start",
					"target" to "node-microservice-1780847337626",
					"sourceHandle" to "output",
					"targetHandle" to "input",
					"type" to "customEdge",
					"data" to mapOf(
						"connectionType" to "rest",
						"payload" to "{\n  \"message\": \"New Message Payload\"\n}",
						"hasMessage" to false,
						"description" to "Connects node-start to node-microservice-1780847337626",
						"routingCondition" to ""
					)
				)
			)
		)

		val structureBytes = objectMapper.writeValueAsBytes(payload)
		println("Original structure JSON string: " + String(structureBytes))
		
		val saved = diagramRepository.save(Diagram(name = "Teszt diagram", structure = structureBytes))
		assertNotNull(saved.id)

		val loaded = diagramRepository.findById(saved.id!!).orElse(null)
		assertNotNull(loaded)
		
		val retrievedBytes = loaded.structure
		val retrievedString = String(retrievedBytes)
		println("Retrieved structure raw string: $retrievedString")
		
		val deserialized = objectMapper.readValue(retrievedBytes, Map::class.java)
		assertEquals("Teszt diagram", loaded.name)
		assertEquals("1.0", deserialized["version"])
		assertEquals("node-start", deserialized["triggerNodeId"])
	}
}


