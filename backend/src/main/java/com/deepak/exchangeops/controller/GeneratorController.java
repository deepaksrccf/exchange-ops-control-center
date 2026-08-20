package com.deepak.exchangeops.controller;

import com.deepak.exchangeops.dto.GeneratorStatusResponse;
import com.deepak.exchangeops.generator.SyntheticEventGenerator;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Controls the synthetic portfolio event generator. */
@RestController
@RequestMapping("/api/v1/generator")
public class GeneratorController {

  private final SyntheticEventGenerator generator;

  public GeneratorController(
      SyntheticEventGenerator generator) {
    this.generator = generator;
  }

  @GetMapping("/status")
  public GeneratorStatusResponse status() {
    return generator.status();
  }

  @PostMapping("/start")
  public GeneratorStatusResponse start() {
    return generator.start();
  }

  @PostMapping("/pause")
  public GeneratorStatusResponse pause() {
    return generator.pause();
  }

  @PostMapping("/resume")
  public GeneratorStatusResponse resume() {
    return generator.resume();
  }

  @PostMapping("/stop")
  public GeneratorStatusResponse stop() {
    return generator.stop();
  }
}
