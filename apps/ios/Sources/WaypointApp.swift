import SwiftUI
import ConvexMobile
import WorkOS

@main
struct WaypointApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                ContentUnavailableView("Waypoint", systemImage: "location.north.circle", description: Text("Careers, with direction."))
                    .navigationTitle("Waypoint")
            }
            .tint(.teal)
        }
    }
}
