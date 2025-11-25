# Node data abstraction

This project aims at showing how to represent nodes from a Neo4j database in a simplified, user friendly manner.

## Getting Started

To run the app, execute the following command:

```bash
npm install
npm run dev
```

## Problem Statement

User data is stored in a Neo4j database that represents data as nodes and edges (relationships). However, presenting this data to the user as is, will look messy as the database gets large.

Hence the question; How do we present this data in a way that users can easily understand - abstracting the complexity of several nodes and edges.

## Considerations

- We need to eliminate the need for connector labels in the UI, so that the db relationships between nodes are inferred.
- We need to represent the UI state (positions, types, and connections) of the UI nodes in the database.
- The user diagram should directly be translated to content on the database.

## Implementation Plan

The UI will provide entitites which can be dragged and dropped on the canvas as nodes. These entities are also to be connected using unlabelled connectors representing edges in the db. The system will infer the relationship between connected entities and store them in the database.


## Images

Database View

<img src="docs/neo4j_view.png" width="300"/>

Recommended User View (Edit to add edges)

<img src="docs/user_view_recommended.png" width="300"/>

# Inferring relationship between nodes

Entities provided on the UI should be given a name that can infer its relationship to other entities its connected to. For example, if a supplier is connected to a company, we can infer the db relationship as SUPPLIES. 

Example 1:
Consider a company (called Company B) that supplies another company (called Company A) with raw materials.
In the UI, Company B can be represented using the SUPPLIER entity, which is connected to COMPANY (Company A). We can then infer the db relationship as SUPPLIES.

We can represent the data in the database as:
if (:COMPANY {name: "B"})-[:SUPPLIES]->(:COMPANY {name: "A"})

Example 2:
Consider employee 1 and employee 2 who both work for Company A.
In the UI, Employee 1 and Employee 2 can be represented using the EMPLOYEE entity, which is connected to COMPANY (Company A). We can then infer the db relationship as WORKS_FOR.

We can represent the data in the database as:
if (:EMPLOYEE {name: "Employee 1"})-[:WORKS_FOR]->(:COMPANY {name: "A"})
if (:EMPLOYEE {name: "Employee 2"})-[:WORKS_FOR]->(:COMPANY {name: "A"})

## Representing UI Nodes on the database.

The Neo4j database stores data in the APOC format. This format shows the nodes and relationships in the database in a JSON format.
Consider a database that has the following nodes, Company A, Company B, Employee 1 and Employee 2.

The following cypher queries can be used to query the database for its nodes and relationships.

```cypher
MATCH (n)
OPTIONAL MATCH (n)-[r]->(m)
RETURN n, r, m
```

```cypher
CALL apoc.export.json.all("graph.json", {})
```

The result displayed using the Neo4j APOC format thus:

```json
{
  "nodes": [
    {
      "id": "1",
      "labels": ["Company"],
      "properties": {
        "name": "Company A"
      }
    },
    {
      "id": "2",
      "labels": ["Company"],
      "properties": {
        "name": "Company B"
      }
    },
    {
      "id": "3",
      "labels": ["Employee"],
      "properties": {
        "name": "Employee 1"
      }
    },
    {
      "id": "4",
      "labels": ["Employee"],
      "properties": {
        "name": "Employee 2"
      }
    }
  ],
  "relationships": [
    {
      "id": "10",
      "type": "SUPPLIES_FOR",
      "start": "2",
      "end": "1",
      "properties": {}
    },
    {
      "id": "11",
      "type": "WORKS_FOR",
      "start": "3",
      "end": "1",
      "properties": {}
    },
    {
      "id": "12",
      "type": "WORKS_FOR",
      "start": "4",
      "end": "1",
      "properties": {}
    }
  ]
}
```

We can attach the UI positions of the nodes to the database by adding a position property to the node.

```json
{
  "nodes": [
    {
      "id": "1",
      "labels": ["Company"],
      "properties": {
        "name": "Company A",
        "position": {
          "x": 100,
          "y": 100
        }
      }
    },
    {
      "id": "2",
      "labels": ["Company"],
      "properties": {
        "name": "Company B",
        "position": {
          "x": 200,
          "y": 200
        }
      }
    },
    {
      "id": "3",
      "labels": ["Employee"],
      "properties": {
        "name": "Employee 1",
        "position": {
          "x": 300,
          "y": 300
        }
      }
    },
    {
      "id": "4",
      "labels": ["Employee"],
      "properties": {
        "name": "Employee 2",
        "position": {
          "x": 400,
          "y": 400
        }
      }
    }
  ],
  "relationships": [
    {
      "id": "10",
      "type": "SUPPLIES_FOR",
      "start": "2",
      "end": "1",
      "properties": {}
    },
    {
      "id": "11",
      "type": "WORKS_FOR",
      "start": "3",
      "end": "1",
      "properties": {}
    },
    {
      "id": "12",
      "type": "WORKS_FOR",
      "start": "4",
      "end": "1",
      "properties": {}
    }
  ]
}
```

We can then abstract the relationships by using them to rename the nodes where applicable.
e.g. use the SUPPLIES_FOR relationship to rename node of id 2 to type SUPPLIER instead of COMPANY
