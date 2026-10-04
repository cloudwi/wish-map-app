require 'xcodeproj'
path = 'ios/app.xcodeproj'
project = Xcodeproj::Project.open(path)
app = project.targets.find { |t| t.name == 'app' }
test = project.new_target(:ui_test_bundle, 'WishMapReleaseUITests', :ios, '15.1')
test.add_dependency(app)
group = project.main_group.new_group('ReleaseUITests', '../ReleaseUITests')
file = group.new_file('ReleaseUITests.swift')
test.source_build_phase.add_file_reference(file)
test.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.wishmap.app.ReleaseUITests'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['TEST_TARGET_NAME'] = 'app'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_build_target(test)
scheme.add_test_target(test)
scheme.set_launch_target(app)
scheme.test_action.build_configuration = 'Release'
scheme.save_as(path, 'WishMapReleaseQA', true)
