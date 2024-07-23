import { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
import { useState, useEffect } from "react";
import { pdfjs } from "react-pdf";

export const PDFTextSearch = (file, searchString) => {
  const [pages, setPages] = useState<string[]>([]);
  const [resultsList, setResultsList] = useState<number[]>([]);

  useEffect(() => {
    pdfjs.getDocument(file).promise.then((docData) => {
      const pageCount = docData._pdfInfo.numPages;

      const pagePromises = Array.from(
        { length: pageCount },
        (_, pageNumber) => {
          return docData.getPage(pageNumber + 1).then((pageData) => {
            return pageData.getTextContent().then((textContent) => {
              return textContent.items.map((item: TextItem) => item.str).join(" ");
            });
          });
        }
      );

      return Promise.all(pagePromises).then((pages) => {
        setPages(pages);
      });
    });
  }, [file]);

  useEffect(() => {
    const updatedResults: number[] = [];
    if (!searchString || !searchString.length) {

      pages.forEach((text, index) => {
        updatedResults.push(index + 1);
      });

      setResultsList(updatedResults);
      return;
    }

    const regex = new RegExp(`${searchString}*`, "i");
    pages.forEach((text, index) => {
      if (text.toLowerCase().indexOf(searchString.toLowerCase()) > -1) {
        updatedResults.push(index + 1);
      }
    });

    setResultsList(updatedResults);
  }, [pages, searchString]);

  return resultsList;
};
