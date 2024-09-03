package prerna.nih;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import prerna.auth.utils.SecurityEngineUtils;
import prerna.auth.utils.SecurityQueryUtils;
import prerna.cluster.util.ClusterUtil;
import prerna.cluster.util.DeleteEngineRunner;
import prerna.engine.api.IEngine;
import prerna.engine.api.IRDBMSEngine;
import prerna.masterdatabase.DeleteFromMasterDB;
import prerna.reactor.AbstractReactor;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.PixelOperationType;
import prerna.sablecc2.om.nounmeta.NounMetadata;
import prerna.usertracking.UserTrackingUtils;
import prerna.util.Constants;
import prerna.util.EngineSyncUtility;
import prerna.util.UploadUtilities;
import prerna.util.Utility;


public class VectorDatabaseManagementReactor extends AbstractReactor {
	private static final Logger classLogger = LogManager.getLogger(VectorDatabaseManagementReactor.class);
	private static final String DATABASE_TAG = "DATABASE_TAG";
	private static final String DAYS_FOR_EXPIRATION = "DAYS TILL DATABASE GET DELETED";
	private static final String DEFFERED_DATE = "2024-09-01 00:00:00"; //September 15, 2024

	public VectorDatabaseManagementReactor() {
		this.keysToGet = new String[] { DAYS_FOR_EXPIRATION, DATABASE_TAG };
		this.keyRequired = new int[] { 1, 1 };
	}

	@Override
	public NounMetadata execute() {
		organizeKeys();
		int numberOfDaysTillExpire = Integer.parseInt(this.keyValue.get(DAYS_FOR_EXPIRATION));
		String database_tag = this.keyValue.get(DATABASE_TAG);
		// #TODO: Might need a fix if there are multiple users
//		if (user != null) {
//		for (AuthProvider provider : user.getLogins()) {
//			String providerName = provider.name();
//			AccessToken token = user.getAccessToken(provider);
//			Map<String, Object> providerMap = new HashMap<String, Object>();
//			providerMap.put("id", token.getId() == null ? "null" : (String) token.getId());
//			providerMap.put("name", token.getName() == null ? "null" : (String) token.getName());
//			providerMap.put("username", token.getUsername() == null ? "null" : (String) token.getUsername());
//		}
//	}
		Map<String, Map<String, Object>> engineInformation = getEngineInformation(database_tag);
		List<Map<String, Object>> latestEngineInformation = getLatestRanInformation(engineInformation,
				getStoredIds(engineInformation));
		// Loop through found databases and delete database
		List<Map<String, Object>> expiringDatabases = getExpiringDatabases(latestEngineInformation, numberOfDaysTillExpire);
		List<String> deletedDbs = deleteDatabases(expiringDatabases);
		return new NounMetadata(deletedDbs, PixelDataType.CONST_STRING, PixelOperationType.DELETE_ENGINE);
	}

	private Map<String, Map<String, Object>> getEngineInformation(String tag) {
		IRDBMSEngine security = null;
		Connection secuirtyCon = null;
		Map<String, Map<String, Object>> engineInfos = null;
		if (tag != null) {
			try {
				try {
					security = (IRDBMSEngine) Utility.getDatabase(Constants.SECURITY_DB);
					secuirtyCon = security.makeConnection();
					engineInfos = new HashMap<>();
					String psString1 = "SELECT ENGINENAME, ENGINE.ENGINEID, CREATEDBY FROM ENGINE INNER JOIN ENGINEMETA ON "
							+ "ENGINEMETA.ENGINEID = ENGINE.ENGINEID WHERE ENGINEMETA.METAVALUE = ?;";
					try (PreparedStatement ps = secuirtyCon.prepareStatement(psString1)) {
						ps.setString(1, tag);
						if (ps.execute()) {
							ResultSet rs = ps.getResultSet();
							while (rs.next()) {
								Map<String, Object> currEngine = new HashMap<String, Object>();
								currEngine.put("Engine Name", rs.getString(1));
								currEngine.put("Engine ID", rs.getString(2));
								currEngine.put("Created By", rs.getString(3));
								engineInfos.put(rs.getString(2), currEngine);
							}
						}
					}
				} finally {
					if (security != null && security.isConnectionPooling() && secuirtyCon != null) {
						secuirtyCon.close();
					}
				}
			} catch (SQLException e) {
				classLogger.error("Catch SQLException Error: " + e);
				return engineInfos;
			}
		} else {
			return new HashMap<>();
		}
		return engineInfos;
	}

	private List<String> getStoredIds(Map<String, Map<String, Object>> engineInformation) {
		List<String> engineIds = new ArrayList<>();
		if (engineInformation.size() > 0) {
			for (String name : engineInformation.keySet()) {
				Map<String, Object> currEngineInfo = engineInformation.get(name);
				engineIds.add((String) currEngineInfo.get("Engine ID"));
			}
		}
		return engineIds;
	}

	private List<Map<String, Object>> getLatestRanInformation(Map<String, Map<String, Object>> engineData,
			List<String> foundEngineIDs) {
		IRDBMSEngine modelInference = null;
		Connection modelInferenceCon = null;
		Map<String, Map<String, Object>> latestInfo = new HashMap<>();
		try {
			try {
				modelInference = (IRDBMSEngine) Utility.getDatabase(Constants.MODEL_INFERENCE_LOGS_DB);
				modelInferenceCon = modelInference.makeConnection();
				String psString1 = "SELECT AGENT_ID, MAX(DATE_CREATED) as LAST_RUN, DATEDIFF(day, MAX(DATE_CREATED), CURRENT_TIMESTAMP) "
						+ "AS DAYS_OLD, DATEDIFF(day, ?, CURRENT_TIMESTAMP) AS DEFFERED_DAYS_OLD FROM MESSAGE GROUP BY AGENT_ID;";
				try (PreparedStatement ps = modelInferenceCon.prepareStatement(psString1)) {
					ps.setString(1, DEFFERED_DATE);
					if (ps.execute()) {
						ResultSet rs = ps.getResultSet();
						while (rs.next()) {
							Map<String, Object> currEngine = new HashMap<String, Object>();
							currEngine.put("Engine ID", rs.getString(1));
							currEngine.put("Last Run", rs.getString(2));
							currEngine.put("Days Old", rs.getString(3));
							currEngine.put("Deffered Days Old", rs.getString(4));
							latestInfo.put(rs.getString(1), currEngine);
						}
					}
				}
			} finally {
				if (modelInference != null && modelInference.isConnectionPooling() && modelInferenceCon != null) {
					modelInferenceCon.close();
				}
			}
		} catch (SQLException e) {
			classLogger.error("Catch SQLException Error: " + e);
			return null;
		}
		List<Map<String, Object>> listOfInformation = new ArrayList<>();
		for (int i = 0; i < foundEngineIDs.size(); i++) {
			if (latestInfo.containsKey(foundEngineIDs.get(i)) && engineData.containsKey(foundEngineIDs.get(i))) {
				Map<String, Object> finalMap = new HashMap<>();
				Map<String, Object> latest = latestInfo.get(foundEngineIDs.get(i));
				Map<String, Object> engine = engineData.get(foundEngineIDs.get(i));
				finalMap.putAll(latest);
				finalMap.putAll(engine);
				listOfInformation.add(finalMap);
			}
		}
		return listOfInformation;
	}
	
	private List<Map<String, Object>> getExpiringDatabases(List<Map<String, Object>> foundDatabases, int expiringDate){
		List<Map<String, Object>> expiringDatabases = new ArrayList<>();
		for (int i = 0; i < foundDatabases.size(); i++) {
			Map<String, Object> currDatabase = foundDatabases.get(i);
			if (Integer.parseInt((String)currDatabase.get("Days Old")) >= expiringDate && 
			Integer.parseInt((String)currDatabase.get("Deffered Days Old")) >= expiringDate){
				expiringDatabases.add(currDatabase);
			}
		}
		return expiringDatabases;
	}
	
	private List<String> deleteDatabases(List<Map<String, Object>> expiringDatabases){
		List<String> deletedDbs = new ArrayList<>();
		for (Map<String, Object> engineIdMap : expiringDatabases) {
			String engineId = (String)engineIdMap.get("Engine ID");
			String engineName = (String)engineIdMap.get("Engine Name");
			// we may have the alias
			engineId = SecurityQueryUtils.testUserEngineIdForAlias(this.insight.getUser(), engineId);
			IEngine engine = Utility.getEngine(engineId);
			IEngine.CATALOG_TYPE engineType = engine.getCatalogType();

			deleteEngines(engine, engineType);
			EngineSyncUtility.clearEngineCache(engineId);
			UserTrackingUtils.deleteEngine(engineId);
			// Run the delete thread in the background for removing from cloud storage
			if (ClusterUtil.IS_CLUSTER) {
				Thread deleteAppThread = new Thread(new DeleteEngineRunner(engineId, engineType));
				deleteAppThread.start();
			}
			deletedDbs.add(engineName);
		}
		return deletedDbs;
	}
	
	private boolean deleteEngines(IEngine engine, IEngine.CATALOG_TYPE engineType) {
		String engineId = engine.getEngineId();
		UploadUtilities.removeEngineFromDIHelper(engineId);
		// remove from local master if database
		if (IEngine.CATALOG_TYPE.DATABASE == engineType) {
			DeleteFromMasterDB remover = new DeleteFromMasterDB();
			remover.deleteEngineRDBMS(engineId);
		}
		// remove from security
		SecurityEngineUtils.deleteEngine(engineId);
		// remove from user tracking
		UserTrackingUtils.deleteEngine(engineId);

		// now try to actually remove from disk
		try {
			engine.delete();
		} catch (IOException e) {
			classLogger.error(Constants.STACKTRACE, e);
		}

		return true;
	}
}
