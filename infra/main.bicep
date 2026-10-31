// Azure Academy infrastructure, described as code.
// This file documents the setup and is checked in CI. It is NOT deployed automatically,
// because the real resources already exist (and a second free-tier Cosmos DB account is not free).

targetScope = 'resourceGroup'

@description('Name of the Static Web App')
param staticSiteName string = 'the-azure-academy'

@description('Static Web Apps supports only a few regions, East US 2 is one of them')
param staticSiteLocation string = 'eastus2'

@description('Globally unique, lowercase name of the Cosmos DB account (kept out of the repo on purpose)')
param cosmosAccountName string

param cosmosLocation string = 'eastus2'

param tags object = {
  project: 'azure-academy'
  environment: 'learning'
}

// Free plan hosting for the site and its managed API.
resource staticSite 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticSiteName
  location: staticSiteLocation
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

// Cosmos DB for NoSQL on the free tier, with throughput capped inside the free allowance.
resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: cosmosLocation
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: true
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: cosmosLocation
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capacity: {
      totalThroughputLimit: 400
    }
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: {
        tier: 'Continuous7Days'
      }
    }
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmos
  name: 'academy'
  properties: {
    resource: {
      id: 'academy'
    }
  }
}

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: database
  name: 'progress'
  properties: {
    resource: {
      id: 'progress'
      partitionKey: {
        paths: [
          '/userId'
        ]
        kind: 'Hash'
      }
    }
    options: {
      throughput: 400
    }
  }
}

// Protects everything in the resource group from accidental deletion.
resource deleteLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'protect-azure-academy'
  properties: {
    level: 'CanNotDelete'
    notes: 'Protects the learning project from accidental deletion'
  }
}

// Secrets are deliberately not output. The Cosmos DB connection string is set by hand
// in the Static Web App settings and never stored in the repository.
output cosmosEndpoint string = cosmos.properties.documentEndpoint
output siteHostname string = staticSite.properties.defaultHostname