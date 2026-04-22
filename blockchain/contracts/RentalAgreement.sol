// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract RentalAgreement {
    
    // State variables
    address public landlord;
    address public tenant;
    uint256 public rentAmount;
    uint256 public depositAmount;
    uint256 public startDate;
    uint256 public endDate;
    string public terms;
    bool public isActive;
    bool public depositPaid;

    // Payment tracking
    uint256 public totalRentPaid;
    uint256 public lastPaymentDate;

    // Events
    event AgreementSigned(
        address indexed tenant,
        address indexed landlord,
        uint256 depositAmount,
        uint256 timestamp
    );

    event RentPaid(
        address indexed tenant,
        uint256 amount,
        uint256 timestamp
    );

    event AgreementTerminated(
        address indexed terminatedBy,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyLandlord() {
        require(msg.sender == landlord, "Only landlord can do this");
        _;
    }

    modifier onlyTenant() {
        require(msg.sender == tenant, "Only tenant can do this");
        _;
    }

    modifier onlyActive() {
        require(isActive, "Agreement is not active");
        _;
    }

    // Constructor — called when contract is deployed
    constructor(
        address _landlord,
        address _tenant,
        uint256 _rentAmount,
        uint256 _depositAmount,
        uint256 _startDate,
        uint256 _endDate,
        string memory _terms
    ) {
        landlord = _landlord;
        tenant = _tenant;
        rentAmount = _rentAmount;
        depositAmount = _depositAmount;
        startDate = _startDate;
        endDate = _endDate;
        terms = _terms;
        isActive = false;
        depositPaid = false;
        totalRentPaid = 0;
    }

    // Tenant signs agreement and pays deposit
    function signAndPayDeposit() external payable onlyTenant {
        require(!isActive, "Agreement already signed");
        require(!depositPaid, "Deposit already paid");
        require(msg.value == depositAmount, "Incorrect deposit amount");

        depositPaid = true;
        isActive = true;

        // Transfer deposit to landlord
        (bool sent, ) = landlord.call{value: msg.value}("");
        require(sent, "Failed to send deposit to landlord");

        emit AgreementSigned(tenant, landlord, msg.value, block.timestamp);
    }

    // Tenant pays monthly rent
    function payRent() external payable onlyTenant onlyActive {
        require(msg.value == rentAmount, "Incorrect rent amount");
        require(block.timestamp <= endDate, "Lease has expired");

        totalRentPaid += msg.value;
        lastPaymentDate = block.timestamp;

        // Transfer rent to landlord
        (bool sent, ) = landlord.call{value: msg.value}("");
        require(sent, "Failed to send rent to landlord");

        emit RentPaid(tenant, msg.value, block.timestamp);
    }

    // Landlord terminates agreement
    function terminate() external onlyLandlord onlyActive {
        isActive = false;
        emit AgreementTerminated(msg.sender, block.timestamp);
    }

    // Get agreement details
    function getDetails() external view returns (
        address _landlord,
        address _tenant,
        uint256 _rentAmount,
        uint256 _depositAmount,
        uint256 _startDate,
        uint256 _endDate,
        bool _isActive,
        bool _depositPaid,
        uint256 _totalRentPaid,
        uint256 _lastPaymentDate
    ) {
        return (
            landlord,
            tenant,
            rentAmount,
            depositAmount,
            startDate,
            endDate,
            isActive,
            depositPaid,
            totalRentPaid,
            lastPaymentDate
        );
    }

    // Check if rent is due
    function isRentDue() external view returns (bool) {
        if (!isActive) return false;
        if (lastPaymentDate == 0) return true;
        return (block.timestamp >= lastPaymentDate + 30 days);
    }
}