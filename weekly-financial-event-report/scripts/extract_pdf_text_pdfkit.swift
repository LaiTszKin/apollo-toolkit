#!/usr/bin/env swift

import Foundation
import PDFKit

struct Arguments {
    let pdfPath: String
}

enum ExtractionError: Error, CustomStringConvertible {
    case missingPath
    case unsupportedPlatform
    case unreadablePDF(String)

    var description: String {
        switch self {
        case .missingPath:
            return "Usage: swift scripts/extract_pdf_text_pdfkit.swift /absolute/path/to/source.pdf"
        case .unsupportedPlatform:
            return "PDFKit extraction is only supported on macOS."
        case .unreadablePDF(let path):
            return "Unable to open PDF at \(path)"
        }
    }
}

func parseArguments() throws -> Arguments {
    let args = Array(CommandLine.arguments.dropFirst())
    guard let pdfPath = args.first, !pdfPath.isEmpty else {
        throw ExtractionError.missingPath
    }
    return Arguments(pdfPath: pdfPath)
}

func main() throws {
    #if !os(macOS)
    throw ExtractionError.unsupportedPlatform
    #else
    let arguments = try parseArguments()
    let pdfURL = URL(fileURLWithPath: arguments.pdfPath)

    guard let document = PDFDocument(url: pdfURL) else {
        throw ExtractionError.unreadablePDF(arguments.pdfPath)
    }

    print("PDF_PATH=\(arguments.pdfPath)")
    print("PAGE_COUNT=\(document.pageCount)")

    for pageIndex in 0..<document.pageCount {
        guard let page = document.page(at: pageIndex) else {
            continue
        }
        let text = page.string?
            .replacingOccurrences(of: "\u{000C}", with: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        print("=== PAGE \(pageIndex + 1) ===")
        if text.isEmpty {
            print("[NO_TEXT_EXTRACTED]")
        } else {
            print(text)
        }
    }
    #endif
}

do {
    try main()
} catch {
    fputs("\(error)\n", stderr)
    exit(1)
}
