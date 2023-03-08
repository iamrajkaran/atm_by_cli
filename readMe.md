Functional requirements:
* `login [name]` - Logs in as this customer and creates the customer if not exist
* `logout` - Logs out of the current customer
* `deposit [amount]` - Deposits this amount to the logged in customer
* `transfer [target] [amount]` - Transfers this amount from the logged in customer to the target customer
* `withdraw [amount]` - Withdraws this amount from the logged in customer
* `exit` - Exit of program and save current state of user

Extended Requirements:
* Save data in file of last state on exit command
* Load last state of data from file

Start of program
* npm run start for normal start
* npm run debug for debugging

Schema design:
    * Used to store user's balance info, credit & debit info with other users
    ex - financeInfo = {
        user: {
            balance,
        totalDebit,
            debit: {
                userB: 10,
            },
        totalCredit,
            credit: {
                userC: 100.
                userB: 20
            },
        }
    };
    * Used to store current login info and till now logged in users
    ex - logInInfo = {
        currentLogin: 'N/A',
        loggedInUsers: {
            userId: {
                name,
                lastLoggedIn,
                lastLoggedOut,
            }
        }
    };

Dependencies:
    No third party
    fs  - for saving state in file
    readline - for taking commands via CLI
