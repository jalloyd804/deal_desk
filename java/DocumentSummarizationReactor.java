package prerna.nih;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.tika.Tika;
import org.apache.tika.metadata.Metadata;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import prerna.reactor.AbstractReactor;
import prerna.reactor.export.pdf.PDFUtility;
import prerna.sablecc2.om.GenRowStruct;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.ReactorKeysEnum;
import prerna.sablecc2.om.nounmeta.NounMetadata;
import prerna.util.AssetUtility;
import prerna.util.Constants;
import prerna.util.Utility;

public class DocumentSummarizationReactor extends AbstractReactor{

	private static final Logger classLogger = LogManager.getLogger(DocumentSummarizationReactor.class);
	private static final String[] SUPPORTED_FILE_TYPES = {"pdf", "docx", "doc"};
	
	public DocumentSummarizationReactor() {
		this.keysToGet = new String[] { ReactorKeysEnum.FILE_PATH.getKey()};
		this.keyRequired = new int[] { 1 };
	}

	@Override
	public NounMetadata execute() {
		organizeKeys();
		String insightFolder = this.insight.getInsightFolder();
		Map<Integer, String> returnedValues = new HashMap<Integer, String>();
		
		try {
			List<String> filePaths = getFiles(insightFolder);
			if (filePaths.isEmpty()) {
				throw new IllegalArgumentException("Please provide valid input files using \"filePaths\". File types supported are pdf, word, ppt, or txt files" + filePaths.toString());
			}
			for (String filePath: filePaths) {
				File foundFile = new File(Utility.normalizePath(filePath));
				// Check if the file exists
				if (!foundFile.exists()) {
					throw new IllegalArgumentException("File path for " + foundFile.getName() + " does not exist within the insight.");
				}
				else {
					if (supportedFileType(Utility.normalizePath(filePath)).equals("pdf")) {
						returnedValues = PDFtoMap(Utility.normalizePath(filePath));
						NounMetadata retNoun = new NounMetadata(returnedValues, PixelDataType.MAP);
						return retNoun;
					}
					else if (supportedFileType(Utility.normalizePath(filePath)).equals("docx") || supportedFileType(Utility.normalizePath(filePath)).equals("doc")) {
						throw new IllegalArgumentException("Upload document : " + foundFile.getName() + ", is a word document. Please convert to a pdf.");
//						String pdfFilePath = createPDF(Utility.normalizePath(filePath));
//						if (pdfFilePath != null) {
//							returnedValues = PDFtoMap(Utility.normalizePath(pdfFilePath));
//							NounMetadata retNoun = new NounMetadata(returnedValues, PixelDataType.MAP);
//							return retNoun;
//						}
//						else {
//							throw new IllegalArgumentException("Document: " + foundFile.getName() + "could not be parsed.");
//						}
					}
				}
			}
			
		} catch (IOException ioe) {
			classLogger.error(Constants.STACKTRACE, ioe);
			throw new IllegalArgumentException("The following IO error occured: " + ioe.getMessage());
		}
		
		NounMetadata retNoun = new NounMetadata(returnedValues, PixelDataType.MAP);
		return retNoun;
	}
	
	
	private Map<Integer, String> PDFtoMap(String filePath){
		Map<Integer, String> mappedFile = new HashMap<Integer, String>();
		try {
			PDDocument document = PDFUtility.createDocument(filePath);
			PDFTextStripper pdfStripper = new PDFTextStripper();
			int numberOfPages = document.getNumberOfPages();
			for (int page = 1; page <= numberOfPages; page++) {
				pdfStripper.setStartPage(page);
				pdfStripper.setEndPage(page);
				String pageContents = pdfStripper.getText(document);
				mappedFile.put(page, pageContents);
			}
			
			document.close();
		}
		catch (IOException e){
			classLogger.error(Constants.ERROR_MESSAGE, e);
		}
		return mappedFile;
	}
	
	private String createPDF(String filePath){
		Map<Integer, String> mappedFile = new HashMap<Integer, String>();
		String[] splitDoc = this.keysToGet[0].split(".");
		String pdfFileName = splitDoc[0] + ".pdf";
		String insightAssetPath = AssetUtility.getAssetVersionBasePath(this.insight, null, true);
		String pdfFilePath = insightAssetPath + pdfFileName;
		try (FileInputStream input = new FileInputStream(new File(filePath))){
			XWPFDocument document = new XWPFDocument(input);
			OutputStream pdfOutputStream = new FileOutputStream(pdfFilePath);
			Document pdfDocument = new Document();
		    PdfWriter.getInstance(pdfDocument, pdfOutputStream);
		    pdfDocument.open();
		    List<XWPFParagraph> paragraphs = document.getParagraphs();
		    for (XWPFParagraph paragraph : paragraphs) {
		        pdfDocument.add(new Paragraph(paragraph.getText()));
		    }
		    pdfDocument.close();
		}
		catch (Exception e){
			classLogger.error(Constants.ERROR_MESSAGE, e);
		}
		return pdfFilePath;
	}
	
	
	private List<String> getFiles(String insightFolder) throws IOException {
		Set<String> filePaths = new HashSet<>();

		// see if added as key
		GenRowStruct grs = this.store.getNoun(this.keysToGet[0]);
		if (grs != null && !grs.isEmpty()) {
			int size = grs.size();
			for (int i = 0; i < size; i++) {
				String currFilePath = grs.get(i).toString();
                if(currFilePath != null && currFilePath.startsWith("/")) {
                	currFilePath = currFilePath.substring(1);
                }
				String filePath = insightFolder + "/" + currFilePath;
				//String filePath = destDirectory + File.separator + entry.getName();
				if(isSupportedFileType(filePath)) {
					filePaths.add(filePath);
				}
			}
		}
		return new ArrayList<>(filePaths);
	}
	
	
	private boolean isSupportedFileType(String filePath) {
		// Find the last index of '.'
		int dotIndex = filePath.lastIndexOf('.');

		if (dotIndex > 0 && dotIndex < filePath.length() - 1) {
			// Extract the extension and convert it to lower case
			String extension = filePath.substring(dotIndex + 1).toLowerCase();

            // || extension.equals("txt") || extension.equals("csv")
			// extension.equals("pdf") || extension.equals("doc") || extension.equals("docx"); 
			return Arrays.asList(SUPPORTED_FILE_TYPES).contains(extension);
		} else {
			// do a mime type check
			Tika tika = new Tika();
			File file = new File(Utility.normalizePath(filePath));
			try (FileInputStream inputstream = new FileInputStream(file)) {
				String mimeType = tika.detect(inputstream, new Metadata());

				switch (mimeType) {
				case "application/pdf":
				case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": // .docx
				// case "application/vnd.ms-powerpoint": // .ppt
				// case "application/vnd.openxmlformats-officedocument.presentationml.presentation": // .pptx
				//case "text/plain":
					return true;
				default:
					return false;
				}
			} catch (IOException e) {
				classLogger.error(Constants.ERROR_MESSAGE, e);
				return false;
			}
		}
	}
	
	private String supportedFileType(String filePath) {
		// Find the last index of '.'
		int dotIndex = filePath.lastIndexOf('.');

		if (dotIndex > 0 && dotIndex < filePath.length() - 1) {
			// Extract the extension and convert it to lower case
			String extension = filePath.substring(dotIndex + 1).toLowerCase();
			for (int i = 0; i <= SUPPORTED_FILE_TYPES.length-1; i++) {
				if (SUPPORTED_FILE_TYPES[i].equals(extension)) {
					return SUPPORTED_FILE_TYPES[i]; 
				}
			}
			return "";
		} else {
			// do a mime type check
			Tika tika = new Tika();
			File file = new File(Utility.normalizePath(filePath));
			try (FileInputStream inputstream = new FileInputStream(file)) {
				String mimeType = tika.detect(inputstream, new Metadata());

				switch (mimeType) {
				case "application/pdf":
					return "pdf";
				case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": // .docx
					return "docx";
				default:
					return "";
				}
			} catch (IOException e) {
				classLogger.error(Constants.ERROR_MESSAGE, e);
				return "";
			}
		}
	}
}
