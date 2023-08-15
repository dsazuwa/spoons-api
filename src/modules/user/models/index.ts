import AuthOTP, { AuthOTPType } from './auth-otp.model';
import Permission from './permission.model';
import RolePermission from './role-permission.model';
import Role from './role.model';
import UserAccount, { UserAccountStatusType } from './user-account.model';
import UserIdentity, { ProviderType } from './user-identity.model';
import UserRole from './user-role.model';
import User from './user.model';

User.hasOne(UserAccount, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserAccount.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

User.hasMany(UserIdentity, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserIdentity.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

UserAccount.hasMany(AuthOTP, { foreignKey: 'userId', onDelete: 'CASCADE' });
AuthOTP.belongsTo(UserAccount, { foreignKey: 'userId', onDelete: 'CASCADE' });

Role.belongsToMany(User, {
  through: 'UserRole',
  foreignKey: 'roleId',
  onDelete: 'CASCADE',
});
User.belongsToMany(Role, {
  through: 'UserRole',
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

Permission.belongsToMany(Role, {
  through: 'RolePermission',
  foreignKey: 'permissionId',
  onDelete: 'CASCADE',
});
Role.belongsToMany(Permission, {
  through: 'RolePermission',
  foreignKey: 'roleId',
  onDelete: 'CASCADE',
});

export {
  AuthOTP,
  AuthOTPType,
  Permission,
  ProviderType,
  Role,
  RolePermission,
  User,
  UserAccount,
  UserAccountStatusType,
  UserIdentity,
  UserRole,
};