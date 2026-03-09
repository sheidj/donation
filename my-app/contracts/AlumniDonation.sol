// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AlumniDonation
 * @dev 校友捐赠追踪平台智能合约
 * 实现捐赠项目管理、资金追踪、透明支出等功能
 */
contract AlumniDonation is AccessControl, ReentrancyGuard, Pausable {
    
    // ==================== 角色定义 ====================
    bytes32 public constant PLATFORM_ADMIN = keccak256("PLATFORM_ADMIN");
    bytes32 public constant PROJECT_AUDITOR = keccak256("PROJECT_AUDITOR");
    
    // ==================== 枚举类型 ====================
    enum ProjectStatus { 
        Draft,      // 草稿
        Active,     // 募集中
        Completed,  // 已完成
        Cancelled   // 已取消
    }
    
    enum ExpenseStatus {
        Pending,    // 待审批
        Approved,   // 已批准
        Rejected,   // 已拒绝
        Executed    // 已执行
    }
    
    // ==================== 数据结构 ====================
    struct Project {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256 targetAmount;
        uint256 raisedAmount;
        uint256 startTime;
        uint256 endTime;
        ProjectStatus status;
        bool exists;
    }
    
    struct Donation {
        uint256 id;
        uint256 projectId;
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
        bool isAnonymous;
        bool exists;
    }
    
    struct Expense {
        uint256 id;
        uint256 projectId;
        string description;
        uint256 amount;
        address recipient;
        ExpenseStatus status;
        uint256 requestTime;
        uint256 executeTime;
        string rejectReason;
        bool exists;
    }
    
    // ==================== 状态变量 ====================
    uint256 public projectCounter;
    uint256 public donationCounter;
    uint256 public expenseCounter;
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Donation) public donations;
    mapping(uint256 => Expense) public expenses;
    
    // 项目ID => 捐赠ID数组
    mapping(uint256 => uint256[]) public projectDonations;
    // 项目ID => 支出ID数组
    mapping(uint256 => uint256[]) public projectExpenses;
    // 捐赠者地址 => 捐赠ID数组
    mapping(address => uint256[]) public donorHistory;
    
    // ==================== 事件定义 ====================
    event ProjectCreated(
        uint256 indexed projectId,
        string name,
        address indexed creator,
        uint256 targetAmount,
        uint256 endTime
    );
    
    event ProjectStatusChanged(
        uint256 indexed projectId,
        ProjectStatus oldStatus,
        ProjectStatus newStatus
    );
    
    event DonationReceived(
        uint256 indexed donationId,
        uint256 indexed projectId,
        address indexed donor,
        uint256 amount,
        bool isAnonymous
    );
    
    event ExpenseRequested(
        uint256 indexed expenseId,
        uint256 indexed projectId,
        uint256 amount,
        string description
    );
    
    event ExpenseApproved(
        uint256 indexed expenseId,
        uint256 indexed projectId,
        uint256 amount
    );

    event ExpenseRejected(
        uint256 indexed expenseId,
        uint256 indexed projectId,
        uint256 amount,
        string reason
    );
    
    event ExpenseExecuted(
        uint256 indexed expenseId,
        uint256 indexed projectId,
        address recipient,
        uint256 amount
    );
    
    event FundsWithdrawn(
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount
    );
    
    // ==================== 构造函数 ====================
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN, msg.sender);
        _grantRole(PROJECT_AUDITOR, msg.sender);
    }
    
    // ==================== 修饰器 ====================
    modifier projectExists(uint256 _projectId) {
        require(projects[_projectId].exists, "Project does not exist");
        _;
    }
    
    modifier onlyActiveProject(uint256 _projectId) {
        require(projects[_projectId].status == ProjectStatus.Active, "Project is not active");
        _;
    }
    
    // ==================== 项目管理函数 ====================
    
    /**
     * @dev 创建新的捐赠项目
     * @param _name 项目名称
     * @param _description 项目描述
     * @param _targetAmount 目标金额（wei）
     * @param _duration 募集持续时间（秒）
     */
    function createProject(
        string calldata _name,
        string calldata _description,
        uint256 _targetAmount,
        uint256 _duration
    ) external onlyRole(PLATFORM_ADMIN) whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0, "Project name cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        projectCounter++;
        uint256 projectId = projectCounter;
        
        projects[projectId] = Project({
            id: projectId,
            name: _name,
            description: _description,
            creator: msg.sender,
            targetAmount: _targetAmount,
            raisedAmount: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            status: ProjectStatus.Active,
            exists: true
        });
        
        emit ProjectCreated(
            projectId,
            _name,
            msg.sender,
            _targetAmount,
            block.timestamp + _duration
        );
        
        return projectId;
    }
    
    /**
     * @dev 更新项目状态
     */
    function updateProjectStatus(
        uint256 _projectId,
        ProjectStatus _newStatus
    ) external onlyRole(PLATFORM_ADMIN) projectExists(_projectId) {
        Project storage project = projects[_projectId];
        ProjectStatus oldStatus = project.status;
        
        require(oldStatus != _newStatus, "New status must be different");
        
        project.status = _newStatus;
        
        emit ProjectStatusChanged(_projectId, oldStatus, _newStatus);
    }
    
    /**
     * @dev 提前结束项目募集
     */
    function completeProject(
        uint256 _projectId
    ) external onlyRole(PLATFORM_ADMIN) projectExists(_projectId) {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Active, "Project must be active");
        
        project.status = ProjectStatus.Completed;
        project.endTime = block.timestamp;
        
        emit ProjectStatusChanged(_projectId, ProjectStatus.Active, ProjectStatus.Completed);
    }
    
    // ==================== 捐赠函数 ====================
    
    /**
     * @dev 向指定项目捐赠
     * @param _projectId 项目ID
     * @param _message 捐赠留言
     * @param _isAnonymous 是否匿名
     */
    function donate(
        uint256 _projectId,
        string calldata _message,
        bool _isAnonymous
    ) external payable nonReentrant whenNotPaused 
      projectExists(_projectId) 
      onlyActiveProject(_projectId) {
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        Project storage project = projects[_projectId];
        require(block.timestamp <= project.endTime, "Project fundraising has ended");
        
        donationCounter++;
        uint256 donationId = donationCounter;
        
        donations[donationId] = Donation({
            id: donationId,
            projectId: _projectId,
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            message: _message,
            isAnonymous: _isAnonymous,
            exists: true
        });
        
        project.raisedAmount += msg.value;
        projectDonations[_projectId].push(donationId);
        donorHistory[msg.sender].push(donationId);
        
        emit DonationReceived(donationId, _projectId, msg.sender, msg.value, _isAnonymous);
    }
    
    // ==================== 支出管理函数 ====================
    
    /**
     * @dev 申请项目资金支出
     * @param _projectId 项目ID
     * @param _description 支出说明
     * @param _amount 支出金额
     * @param _recipient 收款地址
     */
    function requestExpense(
        uint256 _projectId,
        string calldata _description,
        uint256 _amount,
        address _recipient
    ) external onlyRole(PLATFORM_ADMIN) projectExists(_projectId) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_recipient != address(0), "Invalid recipient address");
        
        Project storage project = projects[_projectId];
        require(project.raisedAmount >= _amount, "Insufficient funds");
        
        expenseCounter++;
        uint256 expenseId = expenseCounter;
        
        expenses[expenseId] = Expense({
            id: expenseId,
            projectId: _projectId,
            description: _description,
            amount: _amount,
            recipient: _recipient,
            status: ExpenseStatus.Pending,
            requestTime: block.timestamp,
            executeTime: 0,
            rejectReason: "",
            exists: true
        });
        
        projectExpenses[_projectId].push(expenseId);
        
        emit ExpenseRequested(expenseId, _projectId, _amount, _description);
    }
    
    /**
     * @dev 审批支出申请
     */
    function approveExpense(
        uint256 _expenseId
    ) external onlyRole(PROJECT_AUDITOR) {
        Expense storage expense = expenses[_expenseId];
        require(expense.exists, "Expense does not exist");
        require(expense.status == ExpenseStatus.Pending, "Expense must be pending");
        
        expense.status = ExpenseStatus.Approved;
        
        emit ExpenseApproved(_expenseId, expense.projectId, expense.amount);
    }

    /**
     * @dev 驳回支出申请
     */
    function rejectExpense(
        uint256 _expenseId,
        string calldata _reason
    ) external onlyRole(PROJECT_AUDITOR) {
        Expense storage expense = expenses[_expenseId];
        require(expense.exists, "Expense does not exist");
        require(expense.status == ExpenseStatus.Pending, "Expense must be pending");
        require(bytes(_reason).length > 0, "Reject reason cannot be empty");
        
        expense.status = ExpenseStatus.Rejected;
        expense.rejectReason = _reason;
        
        emit ExpenseRejected(_expenseId, expense.projectId, expense.amount, _reason);
    }
    
    /**
     * @dev 执行已批准的支出
     */
    function executeExpense(
        uint256 _expenseId
    ) external onlyRole(PLATFORM_ADMIN) nonReentrant {
        Expense storage expense = expenses[_expenseId];
        require(expense.exists, "Expense does not exist");
        require(expense.status == ExpenseStatus.Approved, "Expense must be approved");
        
        Project storage project = projects[expense.projectId];
        require(project.raisedAmount >= expense.amount, "Insufficient funds");
        
        expense.status = ExpenseStatus.Executed;
        expense.executeTime = block.timestamp;
        project.raisedAmount -= expense.amount;
        
        (bool success, ) = expense.recipient.call{value: expense.amount}("");
        require(success, "Transfer failed");
        
        emit ExpenseExecuted(
            _expenseId,
            expense.projectId,
            expense.recipient,
            expense.amount
        );
    }
    
    // ==================== 查询函数 ====================
    
    /**
     * @dev 获取项目的所有捐赠记录ID
     */
    function getProjectDonations(uint256 _projectId) external view returns (uint256[] memory) {
        return projectDonations[_projectId];
    }
    
    /**
     * @dev 获取项目的所有支出记录ID
     */
    function getProjectExpenses(uint256 _projectId) external view returns (uint256[] memory) {
        return projectExpenses[_projectId];
    }
    
    /**
     * @dev 获取捐赠者的捐赠历史
     */
    function getDonorHistory(address _donor) external view returns (uint256[] memory) {
        return donorHistory[_donor];
    }
    
    /**
     * @dev 获取项目数量
     */
    function getProjectCount() external view returns (uint256) {
        return projectCounter;
    }
    
    /**
     * @dev 获取捐赠总数
     */
    function getDonationCount() external view returns (uint256) {
        return donationCounter;
    }
    
    /**
     * @dev 获取合约余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 获取项目进度百分比（0-10000，表示0%-100%）
     */
    function getProjectProgress(uint256 _projectId) external view projectExists(_projectId) returns (uint256) {
        Project storage project = projects[_projectId];
        if (project.targetAmount == 0) return 0;
        return (project.raisedAmount * 10000) / project.targetAmount;
    }
    
    // ==================== 管理函数 ====================
    
    /**
     * @dev 紧急暂停合约
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev 接收ETH
     */
    receive() external payable {
        revert("Use donate function to send ETH");
    }
    
    /**
     * @dev 紧急提款（仅管理员）
     */
    function emergencyWithdraw(
        uint256 _projectId
    ) external onlyRole(DEFAULT_ADMIN_ROLE) projectExists(_projectId) nonReentrant {
        Project storage project = projects[_projectId];
        uint256 amount = project.raisedAmount;
        require(amount > 0, "No funds to withdraw");
        
        project.raisedAmount = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(_projectId, msg.sender, amount);
    }
}
