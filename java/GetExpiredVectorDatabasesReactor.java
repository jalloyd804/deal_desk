//package prerna.nih;
package prerna.expired_databases;

import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import prerna.auth.User;
import prerna.auth.utils.SecurityAdminUtils;
import prerna.auth.utils.reactors.admin.AdminMyEnginesReactor;
import prerna.engine.api.IVectorDatabaseEngine;
import prerna.reactor.AbstractReactor;
import prerna.reactor.security.MyEnginesReactor;
import prerna.sablecc2.om.NounStore;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.ReactorKeysEnum;
import prerna.sablecc2.om.nounmeta.NounMetadata;
import prerna.util.Utility;

/**
 * Things to improve my code:
 * 
 * 	- make it applicable to all engineTypes: "VECTOR", "ENGINE", etc. 
 * 		example) this.keysToGet = new String[] {ReactorKeysEnum.ENGINE_TYPE.getKey(), DAYS_FOR_EXPIRATION};
 *	- make it so the tag isn't hard coded to the docbot_repo and the tag wanted can be a parameter. 
 *		example) this.keysToGet = new String[] {ReactorKeysEnum.TAG.getKey(), DAYS_FOR_EXPIRATION};
 * 
 * @author nachabefa
 *
 */
public class GetExpiredVectorDatabasesReactor extends AbstractReactor{
	private static final Logger classLogger = LogManager.getLogger(GetExpiredVectorDatabasesReactor.class);
	private static final String DAYS_FOR_EXPIRATION = "-1";
	
	public GetExpiredVectorDatabasesReactor() {
		this.keysToGet = new String[] { DAYS_FOR_EXPIRATION };
		this.keyRequired = new int[] { 1 };
	}

	@Override
	public NounMetadata execute() {
		organizeKeys();
		Long numberOfDaysTillExpire = Long.parseLong(this.keyValue.get(DAYS_FOR_EXPIRATION));
		User user = this.insight.getUser();
		SecurityAdminUtils adminUtils = SecurityAdminUtils.getInstance(user);
		
		// Running the MyEngines Reactor
		List<Map<String, Object>> result = getVectorDatabases(adminUtils);
		
		// Looping through found databases and recording their database IDs, and tags
		Map<String, Object> databaseInformation = getDatabaseInfo(result, adminUtils);
		
		// Uses the most recently uploaded file to the vector database in order to determine the entire db is within the specified date
		Map<String, Object> complianceMap = needsDeletion(databaseInformation, numberOfDaysTillExpire);
		
		NounMetadata retNoun = new NounMetadata(databaseInformation, PixelDataType.MAP);
		return retNoun;
	}

	
	private List<Map<String, Object>> getVectorDatabases(SecurityAdminUtils adminUtils){
		// Goes through all Vector databases the user has access to and records them
		List<Map<String, Object>> result = null;
		NounStore ns = new NounStore("all");
		ns.makeNoun("engineTypes").addLiteral("VECTOR");
		if(adminUtils == null) {
			MyEnginesReactor getter = new MyEnginesReactor();
			getter.setInsight(insight);
			getter.setNounStore(ns);
			getter.In();
			NounMetadata getResult = getter.execute();
			if (getResult.getNounType() == PixelDataType.ERROR) {
				throw new IllegalArgumentException(getResult.getValue().toString());
			}
			else {
				result = (List<Map<String, Object>>)getResult.getValue();
				return result;
			}
		} else {
			AdminMyEnginesReactor getter = new AdminMyEnginesReactor();
			getter.setInsight(insight);
			getter.setNounStore(ns);
			getter.In();
			NounMetadata getResult = getter.execute();
			if (getResult.getNounType() == PixelDataType.ERROR) {
				throw new IllegalArgumentException(getResult.getValue().toString());
			}
			else {
				result = (List<Map<String, Object>>)getResult.getValue();
				return result;
			}
		}
	}
	
	private Map<String, Object> getDatabaseInfo(List<Map<String, Object>> result, SecurityAdminUtils adminUtils){
		Map<String, Object> databaseInfo = new HashMap<String, Object>();
		Map<String, Object> paramMap = new HashMap<String, Object>();
		
		// Looping through found databases and recording their database IDs as the keys and saving other information like file information and tags
		if (result != null && result.size() > 0) {
			for (int i = 0; i < result.size(); i++) {
				Map<String, Object> currElement = result.get(i);
				Map<String, Object> additionalInfo = new HashMap<String, Object>();
				Object currTag = currElement.get("tag");
				if (currTag != null) {
					String foundTag = (String)currTag.toString().replaceAll("\\s+","").toLowerCase();
					if (foundTag.contains("docbot_repo")) {
						additionalInfo.put("tag", foundTag); 
						if (adminUtils == null) {
							additionalInfo.put("Database Owner", currElement.get("database_created_by"));
						} else {
							additionalInfo.put("Database Owner", currElement.get("engine_created_by"));
						}
						additionalInfo.put("Database Name", currElement.get("database_name"));
						databaseInfo.put((String)currElement.get("database_id"), additionalInfo);
					}
				}
			}
		}
		
		// Looping through found database ids, in order to get each databases list of file information
		for (String name : databaseInfo.keySet()) {
			IVectorDatabaseEngine engine = Utility.getVectorDatabase(name);
			List<Map<String, Object>> listOfFiles = engine.listDocuments(paramMap);
			Object currentObj = databaseInfo.get(name);
			if (listOfFiles != null && currentObj instanceof HashMap<?, ?>) {
				Map<String, Object> additionalInfo = (Map<String, Object>)currentObj;
				additionalInfo.put("Days Since Last Update", newestFileDaysOld(listOfFiles));
				additionalInfo.put("Files Found", listOfFiles);
				databaseInfo.put(name, additionalInfo);
			}
		} 
		return databaseInfo;
	}
	
	// Discussion needed for when the db has no files, should that always be grounds for deletion?
	private long newestFileDaysOld(List<Map<String, Object>> listOfFiles) {
		long diffInDays = Long.MAX_VALUE;
		if (listOfFiles.size() > 0) {
			for (int i = 0; i < listOfFiles.size(); i++) {
				String startDateString = (String)listOfFiles.get(i).get("lastModified");
				SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
				String currentDateString = dateFormat.format(new Date());
				DateTimeFormatter format = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
				LocalDateTime startDate = LocalDateTime.parse(startDateString, format);
				LocalDateTime endDate = LocalDateTime.parse(currentDateString, format);
				long newDaysDiff = ChronoUnit.DAYS.between(startDate, endDate);
				if (newDaysDiff < diffInDays) {
					diffInDays = newDaysDiff;
				}
			}
		}
		return diffInDays;
	}
	
	private Map<String, Object> needsDeletion(Map<String, Object> databaseMap, Long daysTillOutOfCompliance) {
		Map<String, Object> completeDatabaseInfo = new HashMap<String, Object>();
		
		for (String name : databaseMap.keySet()) {
			Object daysOldObject = databaseMap.get(name);
			if (daysOldObject instanceof HashMap<?, ?>) {
				Map<String, Object> daysOldMap = (Map<String, Object>)daysOldObject;
				Object daysOldNumberObject = daysOldMap.get("Days Since Last Update");
				if (daysOldNumberObject instanceof Long) {
					Long daysOldNumber = (Long) daysOldNumberObject;
					daysOldMap.put("Needs Deletion", (daysOldNumber >= daysTillOutOfCompliance));
					completeDatabaseInfo.put(name, daysOldMap);
				}
			}
		}
		return completeDatabaseInfo;
	}
}
