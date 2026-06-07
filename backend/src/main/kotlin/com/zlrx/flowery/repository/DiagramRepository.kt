package com.zlrx.flowery.repository

import com.zlrx.flowery.model.Diagram
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiagramRepository : CrudRepository<Diagram, Long>
