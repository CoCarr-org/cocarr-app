//
//  Cocar_devApp.swift
//  Cocar-dev
//
//  Created by Prakash on 29/07/26.
//

import SwiftUI
import CoreData

@main
struct Cocar_devApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
