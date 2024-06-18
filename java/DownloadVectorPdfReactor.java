package genai_docbot.java;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.FileUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

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
	}

	@Override
	public NounMetadata execute() {
		organizeKeys();
		// get base asset folder
		String filePath = this.keyValue.get(this.keysToGet[0]);
		if(filePath != null && filePath.startsWith("/")) {
			filePath = filePath.substring(1);
		}

	
		String engineId = this.keyValue.get(this.keysToGet[1]);

		IVectorDatabaseEngine engine = Utility.getVectorDatabase(engineId);
		// EngineUtility.getSpecificEngineBaseFolder(engine.getCatalogType(), engine.getEngineId());

		String path = EngineUtility.getSpecificEngineBaseFolder(engine.getCatalogType(), engine.getEngineId(), engine.getEngineName());
		
		
		// System.out.println(engine.listDocuments(null));

		if (engine == null) {
			throw new SemossPixelException("Unable to find engine");
		}
		
		// FixMe plz
		String relativePath = path + "/schema/default/documents";

		File downloadF =  new File(relativePath + "/" + filePath);

		// String fileContents = "";
		
		// try{
		// 	fileContents = FileUtils.readFileToString(downloadF, Charset.forName("UTF-8"));
		// } catch (IOException e) {
		// 	throw new IllegalArgumentException("Unable to read file :" + downloadF);
		// }

	
		
		if(!downloadF.exists()) {
			throw new IllegalArgumentException("Could not find file or directory with name " + downloadF);
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