package genai_docbot.java;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.FileUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.json.*;

import prerna.engine.api.IEngine;
import prerna.engine.api.IVectorDatabaseEngine;
import prerna.om.InsightFile;
import prerna.reactor.AbstractReactor;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.PixelOperationType;
import prerna.sablecc2.om.ReactorKeysEnum;
import prerna.sablecc2.om.execptions.SemossPixelException;
import prerna.sablecc2.om.nounmeta.NounMetadata;
import prerna.util.AssetUtility;
import prerna.util.Constants;
import prerna.util.EngineUtility;
import prerna.util.Utility;
import prerna.util.ZipUtils;

public class DownloadVectorPdfReactor extends AbstractReactor {

	private static final Logger classLogger = LogManager.getLogger(DownloadVectorPdfReactor.class);
	
	public DownloadVectorPdfReactor() {
		this.keysToGet = new String[] { ReactorKeysEnum.FILE_PATH.getKey(), ReactorKeysEnum.ENGINE.getKey()};
		this.keyRequired = new int[] { 1, 1 };
	}

	@Override
	public NounMetadata execute() {
		organizeKeys();
		// get base asset folder
		String filePath = this.keyValue.get(this.keysToGet[0]);
		String engineId = this.keyValue.get(this.keysToGet[1]);
		
		if(filePath != null && filePath.startsWith("/")) {
			filePath = filePath.substring(1);
		}
		
		IVectorDatabaseEngine engine = Utility.getVectorDatabase(engineId);
		
		if (engine == null) {
			throw new SemossPixelException("Unable to find engine");
		}
		
		Map<String, Object> params = new HashMap<String, Object>();
		
		List<Map<String, Object>> listOfFiles = engine.listDocuments(params);
		String finalFilePath = filePath;
		
		if (listOfFiles != null) {
			for (int i = 0; i < listOfFiles.size(); i++) {
				Map<String, Object> currentFile = listOfFiles.get(i);
				String fileName = (String) currentFile.getOrDefault("fileName", "");
				if (fileName != null) {
					String cleanedFileName = fileName.replaceAll("_", "").replaceAll(" ", "");
					String cleanedFilePath = filePath.replaceAll("_", "").replaceAll(" ", "");
					if (cleanedFileName.equals(cleanedFilePath)) {
						finalFilePath = fileName;
						break;
					}
				}
			}
		}

		String path = EngineUtility.getSpecificEngineBaseFolder(engine.getCatalogType(), engine.getEngineId(), engine.getEngineName());

		String relativePath = path + "/schema/default/documents";

		File downloadF =  new File(relativePath + "/" + finalFilePath);
		
		if(!downloadF.exists()) {
			throw new IllegalArgumentException("Could not find file or directory with name " + filePath);
		}

		String downloadFileLocation = downloadF.getAbsolutePath();

		
		// store the insight file 
		// in the insight so the FE can download it
		// only from the given insight
		String downloadKey = UUID.randomUUID().toString();
		InsightFile insightFile = new InsightFile();
		insightFile.setFileKey(downloadKey);
		insightFile.setFilePath(downloadFileLocation);
		insightFile.setDeleteOnInsightClose(false);
		this.insight.addExportFile(downloadKey, insightFile);
		Map<String, String> returnedValues = new HashMap<String, String>();
		returnedValues.put("Download_Key", downloadKey);
		returnedValues.put("Insight_ID", this.insight.getInsightId());
		returnedValues.put("File_Absolute_Path", downloadFileLocation);
		NounMetadata retNoun = new NounMetadata(returnedValues, PixelDataType.MAP);
		return retNoun;
	}

}