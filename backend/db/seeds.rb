# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

Spree::Core::Engine.load_seed if defined?(Spree::Core)

admin_email = ENV['SPREE_ADMIN_EMAIL'] || 'admin@mirzafootwear.com'
admin_password = ENV['SPREE_ADMIN_PASSWORD'] || 'MirzaAdmin2026!'

if defined?(Spree::User) && admin_email.present? && admin_password.present?
  admin = Spree::User.find_or_initialize_by(email: admin_email)
  admin.password = admin_password
  admin.password_confirmation = admin_password
  admin_role = Spree::Role.find_or_create_by(name: 'admin')
  admin.spree_roles << admin_role unless admin.spree_roles.exists?(name: 'admin')
  admin.save!
  puts "[Spree] Admin user #{admin_email} ready."
end
