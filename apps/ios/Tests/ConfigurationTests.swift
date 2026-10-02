import XCTest
@testable import Waypoint

final class ConfigurationTests: XCTestCase {
    func testAppContainsNativeCallbackRegistration() throws {
        let types = try XCTUnwrap(Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]])
        let schemes = types.flatMap { $0["CFBundleURLSchemes"] as? [String] ?? [] }
        XCTAssertTrue(schemes.contains("waypoint"))
        XCTAssertEqual(Bundle.main.object(forInfoDictionaryKey: "WaypointRedirectURI") as? String, "waypoint://callback")
    }
}
