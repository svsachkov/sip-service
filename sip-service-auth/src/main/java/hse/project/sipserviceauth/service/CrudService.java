package hse.project.sipserviceauth.service;

import hse.project.sipserviceauth.exception.ApiRequestException;

import java.util.List;

public interface CrudService<T, K> {
    void create(K entity) throws ApiRequestException;

    List<T> readAll();

    T read(Integer id);

    boolean update(Integer id, T updated) throws ApiRequestException;

    boolean delete(Integer id);
}
