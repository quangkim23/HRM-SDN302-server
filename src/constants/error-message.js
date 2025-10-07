class ErrorMessages {
    static abc = "1 2 3"
    static emailExist = "Email exist"
    static usernameExist = "username exist"
    static missingInput = "missing Input"
    static EmailOrPasswordIsInCorrect = "Email Or Password Is InCorrect"
    static RequireAuthentication = "Require Authentication"
    static InvalidToken = "Invalid Token"
    static EmailIsInCorrect = "Email Is InCorrect"
    static MissingInputSendMail = "Missing Input Send Mail, require (to, subject, html)"
    static EmailIsInCorrectOrExpiredToken = "Email Is InCorrect Or Expired Token"
    static PasswordAndConfirmPasswordMustBeTheSame = "Password And Confirm Password Must Be The Same"
    static RoleIsNotExist = "Role Is Not Exist"
    static RoleNameExist = "Role Name Exist"
    static DepartmentNameExist = "Department Name Exist"
    static ManagerIdNotExist = "ManagerId Not Exist"
    static EmployeeIdNotExist = "EmployeeId Not Exist"
    static StaffReallyJoinedAnotherDepartment = (name) => `Staff ${name} Really Joined Another Department`;
    static DepartmentNotExist = "Department Not Exist"
    static TitleIsDuplicate = "Title Is Duplicate"
    static ManagerIsRequireInEmployees = "Manager Is Require In Employees"
    static SystemError = (errorMessage) => `SystemError ${errorMessage}`;
    static DepartmentHasBeenUsed = "Department Has Been Used"
    static PositionHasBeenUsed = (errorMessage) => `Position ${errorMessage} has been used`;
    static EmployeeHasJoinedDepartment = (errorMessage) => `Employee ${errorMessage} has joined another department`;
    static EmployeeIsNotExist = "Employee Is Not Exist"
    static EmailExist = "Email Exist"
    static PhoneNumberExist = "Phone Number Exist"
    static PositionNotExist = "Position Not Exist"
    static PhoneNumberHasBeenUsed = "PhoneNumber Has Been Used"
    static YouHasCheckIn = "You Has CheckIn"
    static YouAreNotAllowedToAttendThisDay = "You Are Not Allowed To Attend This Day"
    static TimeIsNotAllowedToCheckIn = "Time Is Not Allowed To CheckIn"
    static YouHaveNotCheckedPleaseCheckIn = "You Have Not Checked Please CheckIn"
    static StartDateInvalid = "StartDate Invalid"
    static TheTimeYouChooseIsNotValid = (date) => `The time you choose is not valid, because it has been chosen earlier. ${date}`;
    static LeaveIsNotExist = "Leave Is Not Exist"
    static LeaveIsNotPending = "Leave Is Not Pending"
    
}

Object.freeze(ErrorMessages);

module.exports = ErrorMessages;