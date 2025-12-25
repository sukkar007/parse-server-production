/**
 * Parse Cloud Functions
 * Full CRUD operations for all users
 */

// ==================== TABLE MANAGEMENT ====================

/**
 * Create a new table (class)
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class to create
 * @param {Object} request.params.schema - Initial schema for the class
 */
Parse.Cloud.define('createTable', async (request) => {
  const { className, schema } = request.params;

  if (!className) {
    throw new Error('className is required');
  }

  try {
    // Create a new object to initialize the class
    const obj = new Parse.Object(className);
    if (schema) {
      Object.keys(schema).forEach((key) => {
        obj.set(key, schema[key]);
      });
    }
    obj.setACL(new Parse.ACL()); // Public ACL
    await obj.save(null, { useMasterKey: true });

    return {
      success: true,
      message: `Table '${className}' created successfully`,
      className: className,
    };
  } catch (error) {
    throw new Error(`Failed to create table: ${error.message}`);
  }
});

/**
 * List all tables (classes)
 */
Parse.Cloud.define('listTables', async (request) => {
  try {
    const schema = await Parse.Schema.all();
    const tables = schema.map((s) => ({
      className: s.className,
      fields: Object.keys(s.fields),
    }));

    return {
      success: true,
      tables: tables,
      count: tables.length,
    };
  } catch (error) {
    throw new Error(`Failed to list tables: ${error.message}`);
  }
});

/**
 * Get table schema
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class
 */
Parse.Cloud.define('getTableSchema', async (request) => {
  const { className } = request.params;

  if (!className) {
    throw new Error('className is required');
  }

  try {
    const schema = new Parse.Schema(className);
    const schemaData = await schema.get();

    return {
      success: true,
      className: className,
      fields: schemaData.fields,
    };
  } catch (error) {
    throw new Error(`Failed to get schema: ${error.message}`);
  }
});

/**
 * Delete a table (class)
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class to delete
 */
Parse.Cloud.define('deleteTable', async (request) => {
  const { className } = request.params;

  if (!className) {
    throw new Error('className is required');
  }

  try {
    const schema = new Parse.Schema(className);
    await schema.purge();

    return {
      success: true,
      message: `Table '${className}' deleted successfully`,
    };
  } catch (error) {
    throw new Error(`Failed to delete table: ${error.message}`);
  }
});

// ==================== RECORD OPERATIONS ====================

/**
 * Create a new record
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class
 * @param {Object} request.params.data - Data for the new record
 */
Parse.Cloud.define('createRecord', async (request) => {
  const { className, data } = request.params;

  if (!className || !data) {
    throw new Error('className and data are required');
  }

  try {
    const obj = new Parse.Object(className);
    Object.keys(data).forEach((key) => {
      obj.set(key, data[key]);
    });

    // Set public ACL
    obj.setACL(new Parse.ACL());

    await obj.save(null, { useMasterKey: true });

    return {
      success: true,
      message: 'Record created successfully',
      objectId: obj.id,
      data: obj.toJSON(),
    };
  } catch (error) {
    throw new Error(`Failed to create record: ${error.message}`);
  }
});

/**
 * Read records from a table
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class
 * @param {Object} request.params.filters - Query filters
 * @param {number} request.params.limit - Limit number of results
 * @param {number} request.params.skip - Skip number of results
 */
Parse.Cloud.define('readTable', async (request) => {
  const { className, filters = {}, limit = 100, skip = 0 } = request.params;

  if (!className) {
    throw new Error('className is required');
  }

  try {
    const query = new Parse.Query(className);

    // Apply filters
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value && typeof value === 'object') {
        // Handle complex operators
        if (value.$gt !== undefined) query.greaterThan(key, value.$gt);
        if (value.$lt !== undefined) query.lessThan(key, value.$lt);
        if (value.$gte !== undefined) query.greaterThanOrEqualTo(key, value.$gte);
        if (value.$lte !== undefined) query.lessThanOrEqualTo(key, value.$lte);
        if (value.$ne !== undefined) query.notEqualTo(key, value.$ne);
        if (value.$in !== undefined) query.containedIn(key, value.$in);
      } else {
        query.equalTo(key, value);
      }
    });

    query.limit(limit);
    query.skip(skip);

    const results = await query.find({ useMasterKey: true });

    return {
      success: true,
      className: className,
      count: results.length,
      data: results.map((obj) => obj.toJSON()),
    };
  } catch (error) {
    throw new Error(`Failed to read records: ${error.message}`);
  }
});

/**
 * Update a record
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class
 * @param {string} request.params.objectId - ID of the record to update
 * @param {Object} request.params.data - Data to update
 */
Parse.Cloud.define('updateRecord', async (request) => {
  const { className, objectId, data } = request.params;

  if (!className || !objectId || !data) {
    throw new Error('className, objectId, and data are required');
  }

  try {
    const query = new Parse.Query(className);
    const obj = await query.get(objectId, { useMasterKey: true });

    Object.keys(data).forEach((key) => {
      obj.set(key, data[key]);
    });

    await obj.save(null, { useMasterKey: true });

    return {
      success: true,
      message: 'Record updated successfully',
      objectId: obj.id,
      data: obj.toJSON(),
    };
  } catch (error) {
    throw new Error(`Failed to update record: ${error.message}`);
  }
});

/**
 * Delete a record
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class
 * @param {string} request.params.objectId - ID of the record to delete
 */
Parse.Cloud.define('deleteRecord', async (request) => {
  const { className, objectId } = request.params;

  if (!className || !objectId) {
    throw new Error('className and objectId are required');
  }

  try {
    const query = new Parse.Query(className);
    const obj = await query.get(objectId, { useMasterKey: true });
    await obj.destroy({ useMasterKey: true });

    return {
      success: true,
      message: 'Record deleted successfully',
      objectId: objectId,
    };
  } catch (error) {
    throw new Error(`Failed to delete record: ${error.message}`);
  }
});

/**
 * Batch create records
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class
 * @param {Array} request.params.records - Array of records to create
 */
Parse.Cloud.define('batchCreateRecords', async (request) => {
  const { className, records } = request.params;

  if (!className || !Array.isArray(records)) {
    throw new Error('className and records array are required');
  }

  try {
    const objects = records.map((data) => {
      const obj = new Parse.Object(className);
      Object.keys(data).forEach((key) => {
        obj.set(key, data[key]);
      });
      obj.setACL(new Parse.ACL());
      return obj;
    });

    await Parse.Object.saveAll(objects, { useMasterKey: true });

    return {
      success: true,
      message: `${objects.length} records created successfully`,
      count: objects.length,
      objectIds: objects.map((obj) => obj.id),
    };
  } catch (error) {
    throw new Error(`Failed to batch create records: ${error.message}`);
  }
});

/**
 * Count records
 * @param {Object} request - The request object
 * @param {string} request.params.className - Name of the class
 * @param {Object} request.params.filters - Query filters
 */
Parse.Cloud.define('countRecords', async (request) => {
  const { className, filters = {} } = request.params;

  if (!className) {
    throw new Error('className is required');
  }

  try {
    const query = new Parse.Query(className);

    // Apply filters
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value && typeof value === 'object') {
        if (value.$gt !== undefined) query.greaterThan(key, value.$gt);
        if (value.$lt !== undefined) query.lessThan(key, value.$lt);
        if (value.$gte !== undefined) query.greaterThanOrEqualTo(key, value.$gte);
        if (value.$lte !== undefined) query.lessThanOrEqualTo(key, value.$lte);
        if (value.$ne !== undefined) query.notEqualTo(key, value.$ne);
        if (value.$in !== undefined) query.containedIn(key, value.$in);
      } else {
        query.equalTo(key, value);
      }
    });

    const count = await query.count({ useMasterKey: true });

    return {
      success: true,
      className: className,
      count: count,
    };
  } catch (error) {
    throw new Error(`Failed to count records: ${error.message}`);
  }
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get server info
 */
Parse.Cloud.define('getServerInfo', async (request) => {
  return {
    success: true,
    serverVersion: '4.10.4',
    timestamp: new Date().toISOString(),
    features: {
      liveQueries: true,
      redisCache: true,
      dashboard: true,
      publicAccess: true,
    },
  };
});

/**
 * Health check
 */
Parse.Cloud.define('healthCheck', async (request) => {
  return {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  };
});

console.log('✅ Cloud functions loaded successfully');
