# Node data abstraction

This project aims at showing how to represent nodes from a Neo4j database in a simplified, user friendly manner.

## Getting Started

To run the app, execute the following command:

```bash
npm install
npm run dev
```

## Problem Statement

User data is stored in a Neo4j database that represents data as nodes and edges (relationships).
However, representing this data as is, to the User will become messy as the database gets large.

Hence the question, How do we present this data in a way that users can easily understand - abstracting the complexity of several nodes and edges.

## Considerations

- We need to eliminate/abstract the use of edges by the user in the UI.
- We need to represent the state (positions, types, etc) of the UI nodes in the database.
- The user diagram should directly be translated to content on the database.

## Implementation Plan

We need to infer all entities added as related to the Company Node. (Questions: Are there cases where added nodes is to be related to a different entity, e.g. Employee)
The company Node should hold the basic information of our user.

Database View
<img src="images/neo4j_view.png" width="300"/>

Recommended User View
<img src="images/user_view_recommended.png" width="300"/>

# Eliminating the use of edges from user flow

Represent nodes and their edge (relationship) with an entity that describes both the node and its relationship to the company.

Example 1:
For a user - Company A, trying to add a supplier (Company B) to our system;

We can represent the data in the database as:
if (:COMPANY {name: "B"})-[:SUPPLIES]->(:COMPANY {name: "A"})

However, on the UI:
We'd present B to the user with a SUPPLIER node, which represents both the node and it's relationship to A as presented in the database.

Example 2:
Consider employee 1 and employee 2 who both work for Company A.

We can represent the data in the database as:
if (:EMPLOYEE {name: "Employee 1"})-[:WORKS_FOR]->(:COMPANY {name: "A"})
if (:EMPLOYEE {name: "Employee 2"})-[:WORKS_FOR]->(:COMPANY {name: "A"})

However, on the UI:
We'd present Employee 1 and Employee 2 to the user with a EMPLOYEE node, which represents both the node and it's relationship to A as presented in the database.

## Representing UI Nodes on the database.

Assuming the database has the following nodes, Company A, Company B, Employee 1 and Employee 2.
We can query the database to return all its result.

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
