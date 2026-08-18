package com.deepak.exchangeops.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Transport-stable pagination envelope, decoupled from Spring Data's serialized {@code Page}. */
@Schema(description = "A page of results with pagination metadata.")
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last) {

  public static <E, D> PageResponse<D> from(Page<E> page, Function<E, D> mapper) {
    return of(page, page.getContent().stream().map(mapper).toList());
  }

  /** Wraps already-mapped content, for services that need batch lookups while mapping. */
  public static <E, D> PageResponse<D> of(Page<E> page, List<D> content) {
    return new PageResponse<>(
        content,
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }
}
