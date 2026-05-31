# Hallucinated Code Review Guidelines

## 1. Obtain the Latest Reference Data

If the repo uses external dependencies, identify the currently installed versions. Search the web for the corresponding documentation to verify API accuracy.

## 2. Internal Hallucination Check

Review whether the repo code references non-existent internal methods, classes, or modules.

Check for the following patterns:
- References to deleted or renamed functions/variables
- Method call signature mismatches (wrong parameter count or types)
- References to non-existent or moved file paths
- Imports of symbols that were never exported

## 3. External Hallucination Check

Review whether the repo code references non-existent or outdated external APIs.

Check for the following patterns:
- Calls to API methods that do not exist in the external library
- Usage of deprecated or removed APIs in the current version
- Call signatures that do not match the official documentation
- Assumptions about external service response formats that differ from reality (field naming, nesting structure)
- Configuration key names or formats inconsistent with external tool/platform documentation

## 4. Common Hallucination Patterns

| Pattern | Description | How to Check |
|---------|-------------|--------------|
| Wrong method name | Similar but non-existent method used | Compare against source or type definitions |
| Misordered parameters | Parameter order mismatches function signature | Check function definition's parameter list |
| Assumed response structure | Assumes specific fields in API response | Compare against actual API docs or types |
| Stale import path | Import not updated after refactoring | Verify the target path exists |
| Hallucinated mock | Mock references a non-existent dependency | Verify the mocked object/method actually exists |
| Compile-time constant assumption | Assumes specific enum values or constants exist | Check the enum definition or constants table |
