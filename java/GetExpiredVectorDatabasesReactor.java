package prerna.nih;

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

import prerna.auth.User;
import prerna.engine.api.IRDBMSEngine;
import prerna.reactor.AbstractReactor;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.nounmeta.NounMetadata;
import prerna.util.Constants;
import prerna.util.Utility;


public class GetExpiredVectorDatabasesReactor extends AbstractReactor {
	private static final Logger classLogger = LogManager.getLogger(GetExpiredVectorDatabasesReactor.class);
	private static final String DATABASE_TAG = "DATABASE_TAG";
	private static final String DEFFERED_DATE = "2024-09-01 00:00:00"; //September 15, 2024

	public GetExpiredVectorDatabasesReactor() {
		this.keysToGet = new String[] { DATABASE_TAG };
		this.keyRequired = new int[] { 1 };
	}

	@Override
	public NounMetadata execute() {
		organizeKeys();
		String database_tag = this.keyValue.get(DATABASE_TAG);
		// #TODO: Might need a fix if there are multiple users
		User user = this.insight.getUser();
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
		if (user != null) {
			String username = user.getPrimaryLoginToken().getId();
			Map<String, Map<String, Object>> engineInformation = getEngineInformation(database_tag, username);
			List<Map<String, Object>> latestEngineInformation = getLatestRanInformation(engineInformation,
					getStoredIds(engineInformation));
			return new NounMetadata(latestEngineInformation, PixelDataType.CUSTOM_DATA_STRUCTURE);
		} else {
			classLogger.error("Null User found.");
			return null;
		}
	}

	private Map<String, Map<String, Object>> getEngineInformation(String tag, String user) {
		IRDBMSEngine security = null;
		Connection secuirtyCon = null;
		Map<String, Map<String, Object>> engineInfos = null;
		if (tag != null) {
			try {
				try {
					security = (IRDBMSEngine) Utility.getDatabase(Constants.SECURITY_DB);
					secuirtyCon = security.makeConnection();
					engineInfos = new HashMap<>();
					String psString1 = "SELECT ENGINENAME, ENGINE.ENGINEID, CREATEDBY, DATEDIFF(day, ENGINE.DATECREATED, CURRENT_TIMESTAMP), " +
					"DATEDIFF(day, ?, CURRENT_TIMESTAMP) FROM ENGINE INNER JOIN ENGINEMETA ON ENGINEMETA.ENGINEID = ENGINE.ENGINEID " + 
					"WHERE ENGINEMETA.METAVALUE = ? AND ENGINE.CREATEDBY = ?;";
					try (PreparedStatement ps = secuirtyCon.prepareStatement(psString1)) {
						ps.setString(1, DEFFERED_DATE);
						ps.setString(2, tag);
						ps.setString(3, user);
						if (ps.execute()) {
							ResultSet rs = ps.getResultSet();
							while (rs.next()) {
								Map<String, Object> currEngine = new HashMap<String, Object>();
								currEngine.put("Engine Name", rs.getString(1));
								currEngine.put("Engine ID", rs.getString(2));
								currEngine.put("Created By", rs.getString(3));
								currEngine.put("Date Created Days Old", rs.getString(4));
								currEngine.put("Deffered Days Old", rs.getString(5));
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
						+ "AS DAYS_OLD FROM MESSAGE GROUP BY AGENT_ID;";
				try (PreparedStatement ps = modelInferenceCon.prepareStatement(psString1)) {
					if (ps.execute()) {
						ResultSet rs = ps.getResultSet();
						while (rs.next()) {
							Map<String, Object> currEngine = new HashMap<String, Object>();
							currEngine.put("Engine ID", rs.getString(1));
							currEngine.put("Last Run", rs.getString(2));
							currEngine.put("Days Old", rs.getString(3));
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
		// Compares both maps to the found databaseIds
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
			else if (engineData.containsKey(foundEngineIDs.get(i))){
				Map<String, Object> engine = engineData.get(foundEngineIDs.get(i));
				engine.put("Days Old", engine.get("Date Created Days Old"));
				listOfInformation.add(engine);
			}
		}
		return listOfInformation;
	}
}