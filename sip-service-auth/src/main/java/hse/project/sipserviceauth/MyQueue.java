package hse.project.sipserviceauth;

import hse.project.sipserviceauth.model.domain.Order;

import java.util.LinkedList;
import java.util.List;

public class MyQueue {

    private static List<Order> queue = new LinkedList<>();

    public static List<Order> getQueue() {
        return queue;
    }

    public static void addOrder(Order order) {
        queue.add(order);
    }

    public static void setQueue(List<Order> orders) {
        queue.addAll(orders);
    }

    public static void removeQueue() {
        queue.remove(queue.size() - 1);
    }
}
