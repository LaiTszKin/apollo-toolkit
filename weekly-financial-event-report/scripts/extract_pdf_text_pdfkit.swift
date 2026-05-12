#!/usr/bin/env swift

import Foundation
import PDFKit

let helpText = """
apltk extract-pdf-text-pdfkit — extract PDF text with macOS PDFKit.

Usage:
  apltk extract-pdf-text-pdfkit /absolute/path/to/source.pdf
  swift weekly-financial-event-report/scripts/extract_pdf_text_pdfkit.swift /absolute/path/to/source.pdf

Use this when:
  - You need a simple macOS PDFKit-based text extraction fallback.

Examples:
  apltk extract-pdf-text-pdfkit /absolute/path/to/source.pdf
    Result: prints `PDF_PATH=...`, `PAGE_COUNT=...`, and one `=== PAGE N ===` section per extracted page.
"""

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
            return "Usage: swift scripts/extract_pdf_text_pdfkit.swift /absolute/path/to/source.pdf\nRun with --help for the full command guide."
        case .unsupportedPlatform:
            return "PDFKit extraction is only supported on macOS."
        case .unreadablePDF(let path):
            return "Unable to open PDF at \(path)"
        }
    }
}

enum ParseResult {
    case help
    case arguments(Arguments)
}

func parseArguments() throws -> ParseResult {
    let args = Array(CommandLine.arguments.dropFirst())
    if args.contains("--help") || args.contains("-h") {
        return .help
    }
    guard let pdfPath = args.first, !pdfPath.isEmpty else {
        throw ExtractionError.missingPath
    }
    return .arguments(Arguments(pdfPath: pdfPath))
}

func main() throws {
    #if !os(macOS)
    throw ExtractionError.unsupportedPlatform
    #else
    switch try parseArguments() {
    case .help:
        print(helpText)
        return
    case .arguments(let arguments):
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
    }
    #endif
}

do {
    try main()
} catch {
    fputs("\(error)\n", stderr)
    exit(1)
}
