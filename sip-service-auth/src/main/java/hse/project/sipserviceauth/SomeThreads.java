package hse.project.sipserviceauth;

import java.io.IOException;

public class SomeThreads extends Thread {
    public void run() {
		if (true) {
			String command = "python D:\\Education\\SoftwareEngineering\\PROJECTS\\SatelliteImageryProcessing\\sip-service\\sip-service-auth\\src\\main\\python\\main.py";
			try {
				Process p = Runtime.getRuntime().exec(command);
			} catch (IOException e) {
				System.out.println(e.getMessage());
			}
			System.out.println("STOP");
		}
    }
}
