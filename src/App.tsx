import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )
  

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    
    transactionsByEmployeeUtils.invalidateData()
    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          // when loadAllTransactions is called a isLoading state variable is set to true in the beginning, and to false after all the async functions in the end
          // part1
          // the employeeUtils.fetchAll() returns faster than paginatedTransactionsUtils.fetchAll()
          // so we need to monitor if the employees array is populated and not the isLoading state variable, which will be set to false only after the paginatedTransactionsUtils.fetchAll() returns
          // part 2
          // when we call loadAllTransactions by pressing view more, since we are not dependent on the isLoading variable anymore, but on the fact that employees array is popualted, our employees filter list stays the same
          isLoading={employees === null}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            
            if (newValue === null) {
              return
            }

            // when the app starts, a useEffect in line 40 calls loadAllTransactions, because the employees object gets populated, so initially everything loads in okay
            // in line 63 there is an onchange event that fires when another employee is selected in the dropdown list

            if(newValue.id != ""){  

              // if you do not check for id, this function which requires and id fires, because of onChange event, and we get an error
              // so we check for id and fire it only if a particular employee is selected

              await loadTransactionsByEmployee(newValue.id)

            }else if (newValue.id === "" && newValue.firstName === "All") {

              // in this case we check if the user selected "All employees" in the dropdown, and fire this function which loads in all of the transactions

              loadAllTransactions()

            }

          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">

          <Transactions transactions={transactions} />
          {/* check if the transaction are not null, check if there is a next page in case of "All Employees" filter, and check if the transactionsByEmployee array is empty - if all of these conditions are met then we show the button*/}
          {transactions !== null && paginatedTransactions?.nextPage !== null && transactionsByEmployee == null &&(
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading }
              onClick={async () => {

                  await loadAllTransactions()

              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
