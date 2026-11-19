---
name: manual-unit-tests
description: Design detailed, reproducible manual unit-level test cases for FoodMe business logic, individual functions, calculations, and validation rules. Use when the user requests isolated logic testing, boundary-value analysis, or manual unit-level checks. Inspect the codebase and requirements, identify relevant scenarios, define exact test data and expected results, and report execution status accurately. Not for writing automated JUnit tests.
---


## 1. Analyze the Code Under Test

Before designing test cases:

1. Locate and read the target function, method, calculation, or validation rule.
2. Review related requirements, business rules, and acceptance criteria.
3. Inspect nearby tests and related implementation to understand existing conventions.
4. Identify:
   - The behavior being tested.
   - Input parameters and their types.
   - Expected outputs and possible state changes.
   - Validation rules and error handling.
   - Dependencies and external conditions.
5. Determine whether the logic can be exercised independently through an existing manual entry point.

**Important:**
- Do not assume the current implementation represents the expected behavior.
- Use requirements as the source of truth.
- If requirements and implementation contradict each other, flag the discrepancy.
- Ask for clarification when expected behavior cannot be established.
- Code marked `FM-BUG-NN` is a seeded defect, so never derive expected results from it.

## 2. Design the Test Cases

1. Use descriptive names that communicate both the scenario and expected outcome.

Examples:
- `Verify_valid_price_is_accepted`
- `Verify_negative_price_is_rejected`
- `Verify_maximum_allowed_length_is_accepted`
- `Verify_input_exceeding_maximum_length_is_rejected`

Avoid generic names such as `Check validation` or `Test function`.

2. Identify applicable scenarios based on the target logic.
- Valid and invalid inputs.
- Correct calculation or returned value.
- Correct state changes.
- Missing required values.
- Null or undefined values, where applicable.
- Invalid data types.
- Expected validation and error messages.
- Boundary values and edge cases.
- Zero and negative values, where relevant.
- Empty string.
- Leading and trailing spaces.
- Special characters and Unicode, where relevant.

Do not include irrelevant scenarios simply to increase test case quantity.

3. Every test case must:
- Have its own preconditions.
- Be independently reproducible.
- Not depend on the execution order of another case.
- Avoid changing unrelated data.
- Produce an observable and unambiguous result.

4. Write each case with its name, rule under test, preconditions, input data, steps, expected result and status.

## 3. Checklist Before Finishing

- [ ] Target code and relevant requirements were reviewed.
- [ ] Existing tests and implementation conventions were inspected.
- [ ] Each case covers one specific rule or behavior.
- [ ] Happy paths and relevant negative scenarios are covered.
- [ ] Applicable boundary values and edge cases are included.
- [ ] Exact test data and expected results are specified.
- [ ] Validation messages are checked where required.
- [ ] Each case has independent preconditions and reproducible steps.
- [ ] Isolated execution availability has been verified.
- [ ] Execution statuses reflect actual verification.
- [ ] Unclear requirements and coverage gaps are documented.

## 4. Final Report

Provide a concise summary containing:

1. **Scope:** Function, method, or rule analyzed.
2. **Coverage:** Scenarios and boundaries covered.
3. **Test cases:** Total number of designed cases.
4. **Execution:** Number of Passed, Failed, Not Run, and Blocked cases.
5. **Issues found:** Any discrepancies or potential bugs.
6. **Gaps:** Uncovered scenarios and unclear requirements.
7. **Evidence:** Actual results and relevant screenshots or logs, where available.

If any commands were executed, list them and their actual results.

### Execution Status Definitions

- **Pass:** Observed result matches the expected result.
- **Fail:** Observed result differs from the expected result.
- **Not Run:** Test case is designed but has not been executed.
- **Blocked:** Execution is impossible because a required precondition, dependency, or manual entry point is unavailable.

Never mark a test as Passed based only on code inspection or an expected result.
Never invent actual results, execution evidence, or test outcomes.
