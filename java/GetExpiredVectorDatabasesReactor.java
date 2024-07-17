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

import prerna.engine.api.IVectorDatabaseEngine;
import prerna.reactor.AbstractReactor;
import prerna.reactor.security.MyEnginesReactor;
import prerna.sablecc2.om.NounStore;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.nounmeta.NounMetadata;
import prerna.util.Utility;

public class GetExpiredVectorDatabasesReactor extends AbstractReactor{
	private static final Logger classLogger = LogManager.getLogger(GetExpiredVectorDatabasesReactor.class);
	private static final String NUMBER_OF_DAYS_TILL_EXPIRE = "-1";
	
	public GetExpiredVectorDatabasesReactor() {
		this.keysToGet = new String[] { NUMBER_OF_DAYS_TILL_EXPIRE};
		this.keyRequired = new int[] { 1 };
	}

	@Override
	public NounMetadata execute() {
		organizeKeys();
		Long numberOfDaysTillExpire = Long.parseLong(this.keyValue.get(this.keysToGet[0]));
		
		// Running the MyEngines Reactor
		List<Map<String, Object>> result = getVectorDatabases();
		
		// Looping through found databases and recording their database IDs, and tags
		Map<String, Object> databaseInformation = getDatabaseInfo(result);
		
		// Uses the most recently uploaded file to the vector database in order to determine the entire db is within the specified date
		Map<String, Object> complianceMap = inCompliance(databaseInformation, numberOfDaysTillExpire);
		
		NounMetadata retNoun = new NounMetadata(complianceMap, PixelDataType.MAP);
		return retNoun;
	}

	
	private List<Map<String, Object>> getVectorDatabases(){
		// Goes through all Vector databases the user has access to and records them
		List<Map<String, Object>> result = null;
		NounStore ns = new NounStore("all");
		ns.makeNoun("engineTypes").addLiteral("VECTOR");
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
	}
	
	private Map<String, Object> getDatabaseInfo(List<Map<String, Object>> result){
		Map<String, Object> databaseInfo = new HashMap<String, Object>();
		Map<String, Object> paramMap = new HashMap<String, Object>();
		
		// Looping through found databases and recording their database IDs as the keys and saving other information like file information and tags
		if (result != null && result.size() > 0) {
			for (int i = 0; i < result.size(); i++) {
				Map<String, Object> currElement = result.get(i);
				Map<String, Object> additionalInfo = new HashMap<String, Object>();
				if (currElement.get("database_id") != null && currElement.get("tag") != null) {
					additionalInfo.put("tag", currElement.get("tag").toString().replaceAll("\\s+","").toLowerCase());
					databaseInfo.put((String)currElement.get("database_id"), additionalInfo);
				}
				else if (currElement.get("database_id") != null) {
					additionalInfo.put("tag", null);
					databaseInfo.put((String)currElement.get("database_id"), additionalInfo);
				}
			}
		}
		
		// Looping through found database ids, in order to get each databases list of file information
		for (String name : databaseInfo.keySet()) {
			IVectorDatabaseEngine engine = Utility.getVectorDatabase(name);
			List<Map<String, Object>> listOfFiles = engine.listDocuments(paramMap);
			if (listOfFiles != null) {
				Object currentObj = databaseInfo.get(name);
				if (currentObj instanceof Map<?, ?>) {
					Map<String, Object> additionalInfo = (Map<String, Object>)currentObj;
					additionalInfo.put("Days Since Last Update", newestFileDaysOld(listOfFiles));
					additionalInfo.put("Files Found", listOfFiles);
					databaseInfo.put(name, additionalInfo);
				}
			}
			else {
				Object currentObj = databaseInfo.get(name);
				if (currentObj instanceof Map<?, ?>) {
					Map<String, Object> additionalInfo = (Map<String, Object>)currentObj;
					additionalInfo.put("Days Since Last Update", -1);
					databaseInfo.put(name, additionalInfo);
				}
			}
		} 
		return databaseInfo;
	}
	
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
	
	private Map<String, Object> inCompliance(Map<String, Object> databaseMap, Long daysTillOutOfCompliance) {
		Map<String, Object> completeDatabaseInfo = new HashMap<String, Object>();
		
		for (String name : databaseMap.keySet()) {
			Object daysOldObject = databaseMap.get(name);
			if (daysOldObject instanceof HashMap<?, ?>) {
				Map<String, Object> daysOldMap = (Map<String, Object>)daysOldObject;
				Object daysOldNumberObject = daysOldMap.get("Days Since Last Update");
				if (daysOldNumberObject instanceof Long) {
					Long daysOldNumber = (Long) daysOldNumberObject;
					if (daysOldNumber >= daysTillOutOfCompliance) {
						daysOldMap.put("Needs Deletion", true);
						completeDatabaseInfo.put(name, daysOldMap);
					}
					else {
						daysOldMap.put("Needs Deletion", false);
						completeDatabaseInfo.put(name, daysOldMap);
					}
				}
			}
		}
		return completeDatabaseInfo;
	}
}
