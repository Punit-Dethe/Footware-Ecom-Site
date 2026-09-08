# frozen_string_literal: true

Spree::Core::Engine.load_seed if defined?(Spree::Core)

admin_email = ENV['SPREE_ADMIN_EMAIL'] || 'admin@mirzafootwear.com'
admin_password = ENV['SPREE_ADMIN_PASSWORD'] || 'MirzaAdmin2026!'

# Ensure Spree::AdminUser
if defined?(Spree::AdminUser) && admin_email.present? && admin_password.present?
  admin = Spree::AdminUser.find_or_initialize_by(email: admin_email)
  admin.password = admin_password
  admin.password_confirmation = admin_password
  admin.first_name = 'Mirza'
  admin.last_name = 'Admin'
  admin.save!

  admin_role = Spree::Role.find_or_create_by(name: 'admin')
  default_store = Spree::Store.default || Spree::Store.first
  if default_store
    Spree::RoleUser.find_or_create_by!(
      role: admin_role,
      user: admin,
      resource: default_store,
      store: default_store
    )
  end
  puts "[Spree] Admin user #{admin_email} ready."
end

# Ensure Spree::User for customer store login
if defined?(Spree::User) && admin_email.present? && admin_password.present?
  customer = Spree::User.find_or_initialize_by(email: admin_email)
  customer.password = admin_password
  customer.password_confirmation = admin_password
  admin_role = Spree::Role.find_or_create_by(name: 'admin')
  customer.spree_roles << admin_role unless customer.spree_roles.exists?(name: 'admin')
  customer.save!
  puts "[Spree] Customer admin #{admin_email} ready."
end
