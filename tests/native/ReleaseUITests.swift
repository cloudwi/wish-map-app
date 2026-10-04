import XCTest

final class ReleaseUITests: XCTestCase {
    func capture(_ app: XCUIApplication, _ name: String) {
        let image = XCTAttachment(uniformTypeIdentifier: "public.jpeg", name: name, payload: app.screenshot().image.jpegData(compressionQuality: 0.95)!, userInfo: nil)
        image.lifetime = .keepAlways
        add(image)
    }
    func testGuestScreens() {
        continueAfterFailure = false
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.buttons["열기"].exists { springboard.buttons["열기"].tap() }
        let app = XCUIApplication(bundleIdentifier: "com.wishmap.app")
        app.launch()
        XCTAssertTrue(app.staticTexts["함께할 파티"].waitForExistence(timeout: 20))
        capture(app, "01-home")
        let create = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "파티 만들기")).firstMatch
        XCTAssertTrue(create.exists)
        create.tap()
        XCTAssertTrue(app.staticTexts["함께할 준비가 됐나요?"].waitForExistence(timeout: 10))
        capture(app, "02-login")
        app.buttons["로그인 없이 둘러보기"].tap()
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "마이")).firstMatch.tap()
        XCTAssertTrue(app.buttons["휴대폰 번호로 시작하기"].waitForExistence(timeout: 10))
        XCTAssertGreaterThan(app.staticTexts["나의 위시맵"].firstMatch.frame.minY, 60, "My page heading must stay below the status bar")
        capture(app, "03-mypage")
    }
}
